export type RosterPromoter = { id: string; name: string; operationId: string | null };
export type RouteDraft = { key: string; promoterId: string; storeId: string; industryIds: string[]; scheduledDate: string; status: 'PLANEJADA' | 'REALIZADA' | 'CANCELADA' };
export function promoterDisplayName(name: string | null | undefined) { return name?.trim() || 'Promotor não identificado'; }
export function promoterInitials(name: string | null | undefined) { return promoterDisplayName(name).split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('pt-BR'); }
export function compatiblePromoters(promoters: RosterPromoter[], operationId?: string) { return promoters.filter((promoter) => !operationId || promoter.operationId === operationId); }
export function groupPromotersById<T extends RouteDraft>(promoters: RosterPromoter[], draft: T[], operationId?: string) {
  const roster = new Map(compatiblePromoters(promoters, operationId).map((promoter) => [promoter.id, promoter]));
  for (const visit of draft) if (!roster.has(visit.promoterId)) roster.set(visit.promoterId, { id: visit.promoterId, name: '', operationId: operationId ?? null });
  return [...roster.values()].map((promoter) => ({ ...promoter, name: promoterDisplayName(promoter.name), visits: draft.filter((visit) => visit.promoterId === promoter.id) })).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
export function removePromoterPlanning(draft: RouteDraft[], promoterId: string) { return draft.filter((visit) => visit.promoterId !== promoterId || visit.status !== 'PLANEJADA'); }