import { Operation, Promoter, Store, Industry, Visit, VisitStatus } from '@prisma/client';

/**
 * OperationPlanner is responsible for generating visits for an operation based on
 * promoters, stores, industries, and frequencies.
 * 
 * The planner follows these rules:
 * - Visits are generated only on weekdays (Monday to Friday)
 * - Visits are distributed as evenly as possible throughout the month
 * - Duplicate visits (same promoter, store, industry on same date) are avoided
 * - The planner does not modify the database; it returns visits to be created
 * 
 * Algorithm for distributing visits:
 * 1. Calculate all weekdays in the operation's month
 * 2. For each promoter-store-industry combination with frequency > 0:
 *    a. Determine number of visits needed (frequency)
 *    b. Spread visits evenly across available weekdays using index-based distribution
 *    c. For each target date, check if visit already exists (ignoring time)
 *    d. If not exists, add to visits to create
 * 
 * @visits already exist (ignoring time)
 *    d. If not exists, add to visits to create
 * 
 * @example
 * ```typescript
 * const planner = new OperationPlanner();
 * const result = planner.generateVisits(
 *   operation,
 *   promoters,
 *   stores,
 *   industries,
 *   frequencies, // Map<"promoterId-storeId-industryId", number>
 *   existingVisits
 * );
 * 
 * // result.visitsToCreate contains visits to insert in DB
 * // result.statistics contains generation metrics
 * ```
 */
export class OperationPlanner {
  /**
   * Generates visits for the given operation
   * @param operation - The operation for which to generate visits
   * @param promoters - Array of active promoters
   * @param stores - Array of stores
   * @param industries - Array of industries
   * @param frequencies - Map of visit frequencies per combination.
   *                     Key format: "promoterId-storeId-industryId"
   *                     Value: number of visits to generate for that combination in the month
   * @param existingVisits - Array of existing visits to avoid duplicates
   * @returns Object containing visits to create and generation statistics
   */
  generateVisits(
    operation: Operation,
    promoters: Promoter[],
    stores: Store[],
    industries: Industry[],
    frequencies: Map<string, number>,
    existingVisits: Visit[]
  ) {
    // Validate operation status
    if (operation.status !== 'PLANNING') {
      throw new Error('Can only generate visits for operations in PLANNING status');
    }

    // Get first and last day of the month
    const startDate = new Date(operation.year, operation.month - 1, 1);
    const endDate = new Date(operation.year, operation.month, 0); // Last day of month

    // Get all weekdays (Mon-Fri) in the month
    const weekdays = this.getWeekdaysInMonth(startDate, endDate);

    if (weekdays.length === 0) {
      return {
        visitsToCreate: [],
        statistics: {
          total: 0,
          byPromoter: {},
          byStore: {},
          byIndustry: {},
          byWeek: {}
        }
      };
    }

    const visitsToCreate: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const statistics = {
      total: 0,
      byPromoter: {} as Record<string, number>,
      byStore: {} as Record<string, number>,
      byIndustry: {} as Record<string, number>,
      byWeek: {} as Record<string, number>
    };

    // Initialize statistics counters
    promoters.forEach(p => { statistics.byPromoter[p.id] = 0; });
    stores.forEach(s => { statistics.byStore[s.id] = 0; });
    industries.forEach(i => { statistics.byIndustry[i.id] = 0; });

    // Process each promoter-store-industry combination
    promoters.forEach(promoter => {
      stores.forEach(store => {
        industries.forEach(industry => {
          const key = `${promoter.id}-${store.id}-${industry.id}`;
          const frequency = frequencies.get(key) ?? 0;

          if (frequency <= 0) {
            return; // Skip if no visits needed
          }

          // Generate visit dates for this combination
          const visitDates = this.spreadVisitsOverDays(weekdays, frequency);

          visitDates.forEach(date => {
            // Check for duplicate (same promoter, store, industry on same date)
            const isDuplicate = existingVisits.some(existingVisit =>
              existingVisit.promoterId === promoter.id &&
              existingVisit.storeId === store.id &&
              existingVisit.industryId === industry.id &&
              this.isSameDate(existingVisit.scheduledDate, date)
            );

            if (!isDuplicate) {
              // Create visit object (time set to 9:00 AM)
              const visitDate = new Date(date);
              visitDate.setHours(9, 0, 0, 0);

              const visit: Omit<Visit, 'id' | 'createdAt' | 'updatedAt'> = {
                operationId: operation.id,
                promoterId: promoter.id,
                storeId: store.id,
                industryId: industry.id,
                scheduledDate: visitDate,
                status: 'PLANEJADA' as VisitStatus,
                completedDate: undefined // Explicitly set undefined for optional field
              };

              visitsToCreate.push(visit);

              // Update statistics
              statistics.total++;
              statistics.byPromoter[promoter.id] = (statistics.byPromoter[promoter.id] || 0) + 1;
              statistics.byStore[store.id] = (statistics.byStore[store.id] || 0) + 1;
              statistics.byIndustry[industry.id] = (statistics.byIndustry[industry.id] || 0) + 1;

              // Calculate week number (1-4 or 1-5 depending on month)
              const weekNumber = Math.ceil(date.getDate() / 7);
              const weekKey = `Week ${weekNumber}`;
              statistics.byWeek[weekKey] = (statistics.byWeek[weekKey] || 0) + 1;
            }
          });
        });
      });
    });

    return {
      visitsToCreate,
      statistics
    };
  }

  /**
   * Gets all weekdays (Monday to Friday) between two dates (inclusive)
   * @param start - Start date
   * @param end - End date
   * @returns Array of Date objects representing weekdays
   */
  private getWeekdaysInMonth(start: Date, end: Date): Date[] {
    const weekdays: Date[] = [];
    const current = new Date(start);

    while (current <= end) {
      const day = current.getDay();
      // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      if (day >= 1 && day <= 5) { // Monday to Friday
        weekdays.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return weekdays;
  }

  /**
   * Spreads n visits evenly over the available days
   * @param availableDays - Array of available dates
   * @param n - Number of visits to spread
   * @returns Array of dates where visits should occur
   */
  private spreadVisitsOverDays(availableDays: Date[], n: number): Date[] {
    if (n <= 0 || availableDays.length === 0) {
      return [];
    }

    // If we need more visits than available days, we cap at available days
    const visitsToGenerate = Math.min(n, availableDays.length);
    const result: Date[] = [];

    // Spread evenly using index-based distribution
    for (let i = 0; i < visitsToGenerate; i++) {
      const index = Math.floor((i * availableDays.length) / visitsToGenerate);
      // Avoid pushing the same index multiple times (though unlikely with floor distribution)
      const date = new Date(availableDays[index]);
      result.push(date);
    }

    return result;
  }

  /**
   * Checks if two dates represent the same day (ignoring time)
   * @param date1 - First date
   * @param date2 - Second date
   * @returns True if same year, month, and day
   */
  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }
}

// Export a singleton instance for convenience
export const operationPlanner = new OperationPlanner();