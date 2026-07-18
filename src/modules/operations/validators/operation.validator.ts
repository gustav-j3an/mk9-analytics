import { z } from 'zod';
import { OperationStatus, VisitStatus } from '@prisma/client';

/**
 * Zod schema for operation validation
 */
export const operationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  month: z.number().int().min(1, 'Month must be between 1 and 12').max(12, 'Month must be between 1 and 12'),
  year: z.number().int().min(2020, 'Year must be 2020 or later'),
  startsAt: z.date(),
  endsAt: z.date(),
  status: z.nativeEnum(OperationStatus).optional(),
  description: z.string().max(1000).optional(),
  clientId: z.string().optional(),
  observations: z.string().optional(),
});

/**
 * Zod schema for operation update (partial)
 */
export const operationUpdateSchema = operationSchema.partial();

/**
 * Validate operation data
 * @param data - Data to validate
 * @returns Validated data or throws Zod error
 */
export function validateOperationData(data: unknown) {
  return operationSchema.parse(data);
}

/**
 * Validate operation update data
 * @param data - Data to validate
 * @returns Validated data or throws Zod error
 */
export function validateOperationUpdateData(data: unknown) {
  return operationUpdateSchema.parse(data);
}

/**
 * Validate date range for operation
 * @param startsAt - Start date
 * @param endsAt - End date
 * @returns True if valid
 */
export function validateDateRange(startsAt: Date, endsAt: Date): boolean {
  return endsAt >= startsAt;
}

/**
 * Validate month and year consistency with dates
 * @param month - Month (1-12)
 * @param year - Year
 * @param startsAt - Start date
 * @param endsAt - End date
 * @returns True if consistent
 */
export function validateMonthYearDates(
  month: number,
  year: number,
  startsAt: Date,
  endsAt: Date
): boolean {
  const startMonth = startsAt.getMonth() + 1;
  const startYear = startsAt.getFullYear();
  const endMonth = endsAt.getMonth() + 1;
  const endYear = endsAt.getFullYear();

  return (
    startMonth === month &&
    startYear === year &&
    endMonth === month &&
    endYear === year
  );
}

/**
 * Validate that operation dates are within month/year boundaries
 * @param month - Month (1-12)
 * @param year - Year
 * @param startsAt - Start date
 * @param endsAt - End date
 * @returns True if valid
 */
export function validateDatesInMonthYear(
  month: number,
  year: number,
  startsAt: Date,
  endsAt: Date
): boolean {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  return (
    startsAt >= startOfMonth &&
    endsAt <= endOfMonth &&
    startsAt <= endsAt
  );
}

export type OperationFormValues = z.infer<typeof operationSchema>;