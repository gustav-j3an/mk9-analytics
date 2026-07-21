import type { StoreCandidate } from '../store/StoreCandidate';
import type { IndustryCandidate } from '../industry/IndustryCandidate';
import type { PromoterCandidate } from '../promoter/PromoterCandidate';

export interface VisitCandidate {
  store: StoreCandidate;
  industry: IndustryCandidate;
  promoter: PromoterCandidate | null;
  frequency: number; // Frequência mensal de visitas calculada
  frequencyType: 'WEEKLY' | 'MONTHLY' | 'NONE';
  plannedVisitIndex: number; // Índice 1-based da visita no mês (1 a frequency)
  scheduledDate?: Date;
  completed?: boolean;
  deduplicationKey: string;
  originalData: Record<string, unknown>;
}
