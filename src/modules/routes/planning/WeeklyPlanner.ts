import { canonicalize } from '@/modules/shared/normalization';
import type { StoreCandidate } from '@/modules/mapping/store/StoreCandidate';
import type { IndustryCandidate } from '@/modules/mapping/industry/IndustryCandidate';
import type { PromoterCandidate } from '@/modules/mapping/promoter/PromoterCandidate';
import type { VisitCandidate } from '@/modules/mapping/visit/VisitCandidate';
import { isVisitMarked } from '@/modules/imports/utils/visit-markers';

export const PLANNED_WEEKDAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'] as const;

function firstMondayOnOrAfter(date: Date): Date {
  const result = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12));
  const day = result.getUTCDay();
  result.setUTCDate(result.getUTCDate() + ((8 - day) % 7));
  return result;
}

export interface WeeklyPlannerInput {
  row: Record<string, unknown>;
  store: StoreCandidate;
  industry: IndustryCandidate;
  promoter: PromoterCandidate;
}

export class WeeklyPlanner {
  static plan(input: WeeklyPlannerInput, operation: { startsAt: Date; endsAt: Date }): VisitCandidate[] {
    const weeklyFrequency = Math.max(0, Math.trunc(Number(input.row.VISITA_SEMANAL) || 0));
    if (weeklyFrequency === 0) return [];
    const monday = firstMondayOnOrAfter(operation.startsAt);
    const markedDays = PLANNED_WEEKDAYS.filter((weekday) => isVisitMarked(input.row[weekday])).slice(0, weeklyFrequency);
    return markedDays.flatMap((weekday) => {
      const dayOffset = PLANNED_WEEKDAYS.indexOf(weekday);
      const scheduledDate = new Date(monday);
      scheduledDate.setUTCDate(monday.getUTCDate() + dayOffset);
      if (scheduledDate > operation.endsAt) return [];
      return [{
        store: input.store,
        industry: input.industry,
        promoter: input.promoter,
        frequency: weeklyFrequency,
        frequencyType: 'WEEKLY' as const,
        plannedVisitIndex: dayOffset + 1,
        scheduledDate,
        completed: false,
        deduplicationKey: `VISIT:${input.store.code}:${input.industry.code}:${input.promoter.normalizedName}:${scheduledDate.toISOString().slice(0, 10)}`,
        originalData: input.row,
      }];
    });
  }

  static routeKey(row: Record<string, unknown>, weekday: string): string {
    return [row.PROMOTOR, row.LOJA, row.INDUSTRIA, weekday].map((value) => canonicalize(String(value ?? ''))).join('|');
  }
}
