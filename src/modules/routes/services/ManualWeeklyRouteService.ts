import { Prisma, type VisitStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export type ManualVisitInput = {
  id?: string;
  operationId: string;
  promoterId: string;
  storeId: string;
  industryIds: string[];
  scheduledDate: string;
  routeOrder: number;
  weeklyFrequency: number;
  plannedTime?: string | null;
  estimatedDurationMinutes?: number | null;
  notes?: string | null;
  status: VisitStatus;
  conflictJustification?: string;
};

export type WeeklyRouteBatch = {
  upserts: ManualVisitInput[];
  deleteIds: string[];
  scopeOperationIds: string[];
};

export type RouteConflict = {
  code: 'DUPLICATE_VISIT' | 'MULTIPLE_STORES_INDUSTRIES' | 'ORDER_CONFLICT';
  message: string;
  inputIndex: number;
};

export class ManualRouteError extends Error {
  constructor(
    public readonly code: 'INVALID_ROUTE' | 'ROUTE_CONFLICT' | 'ROUTE_FORBIDDEN' | 'ROUTE_NOT_FOUND' | 'ROUTE_SAVE_FAILED',
    public readonly status: 400 | 403 | 404 | 409 | 500,
    message: string,
    public readonly conflicts: RouteConflict[] = [],
  ) {
    super(message);
    this.name = 'ManualRouteError';
  }
}

function dayKey(value: Date | string) {
  return new Date(value).toISOString().slice(0, 10);
}

export function validateWeeklyRouteDraft(inputs: ManualVisitInput[]): RouteConflict[] {
  const conflicts: RouteConflict[] = [];
  const duplicates = new Map<string, number>();
  const orders = new Map<string, number>();
  const dayAssignments = new Map<string, Array<{ storeId: string; industries: string[] }>>();
  inputs.forEach((input, inputIndex) => {
    for (const industryId of input.industryIds) {
      const key = `${input.operationId}:${input.promoterId}:${input.storeId}:${industryId}:${dayKey(input.scheduledDate)}`;
      if (duplicates.has(key)) conflicts.push({ code: 'DUPLICATE_VISIT', message: 'A mesma indústria, loja, promotor e dia já está no roteiro.', inputIndex });
      else duplicates.set(key, inputIndex);
    }
    const orderKey = `${input.operationId}:${input.promoterId}:${dayKey(input.scheduledDate)}:${input.routeOrder}`;
    if (orders.has(orderKey)) conflicts.push({ code: 'ORDER_CONFLICT', message: `A ordem ${input.routeOrder} já está ocupada neste dia.`, inputIndex });
    else orders.set(orderKey, inputIndex);
    const day = `${input.operationId}:${input.promoterId}:${dayKey(input.scheduledDate)}`;
    const assignments = dayAssignments.get(day) ?? [];
    if (assignments.some((item) => item.storeId !== input.storeId && item.industries.some((industry) => input.industryIds.includes(industry)))) {
      conflicts.push({ code: 'MULTIPLE_STORES_INDUSTRIES', message: 'Este promotor já atende outra indústria em outra loja neste dia.', inputIndex });
    }
    assignments.push({ storeId: input.storeId, industries: input.industryIds });
    dayAssignments.set(day, assignments);
  });
  return conflicts;
}

export function groupRouteVisits<T extends { promoterId: string; storeId: string; scheduledDate: string; industryId: string }>(visits: T[]) {
  return [...visits.reduce((groups, visit) => {
    const key = `${visit.promoterId}:${visit.storeId}:${dayKey(visit.scheduledDate)}`;
    const group = groups.get(key) ?? { key, visits: [] as T[], industryIds: [] as string[] };
    group.visits.push(visit);
    if (!group.industryIds.includes(visit.industryId)) group.industryIds.push(visit.industryId);
    groups.set(key, group);
    return groups;
  }, new Map<string, { key: string; visits: T[]; industryIds: string[] }>()).values()];
}

export async function saveWeeklyRouteBatch(batch: WeeklyRouteBatch) {
  try {
    return await prisma.$transaction(async (tx) => {
      const operationIds = [...new Set(batch.scopeOperationIds)];
      if (!operationIds.length || batch.upserts.some((item) => !operationIds.includes(item.operationId))) {
        throw new ManualRouteError('INVALID_ROUTE', 400, 'Escopo de operações inválido.');
      }
      const promoterIds = [...new Set(batch.upserts.map((item) => item.promoterId))];
      const storeIds = [...new Set(batch.upserts.map((item) => item.storeId))];
      const industryIds = [...new Set(batch.upserts.flatMap((item) => item.industryIds))];
      const [operations, promoters, stores, industries, existingToDelete] = await Promise.all([
        tx.operation.findMany({ where: { id: { in: operationIds } } }),
        tx.promoter.findMany({ where: { id: { in: promoterIds }, deletedAt: null } }),
        tx.store.findMany({ where: { id: { in: storeIds }, archivedAt: null } }),
        tx.industry.findMany({ where: { id: { in: industryIds }, archivedAt: null } }),
        tx.visit.findMany({ where: { id: { in: batch.deleteIds } }, include: { evidences: { select: { id: true } } } }),
      ]);
      if (existingToDelete.some((item) => !operationIds.includes(item.operationId))) throw new ManualRouteError('ROUTE_FORBIDDEN', 403, 'A alteração contém visitas de outra operação.');
      if (operations.length !== operationIds.length || operations.some((item) => item.status === 'ARCHIVED' || item.status === 'FINISHED' || item.status === 'CANCELLED')) {
        throw new ManualRouteError('INVALID_ROUTE', 400, 'Operação inexistente, arquivada ou encerrada.');
      }
      if (promoters.length !== promoterIds.length) throw new ManualRouteError('INVALID_ROUTE', 400, 'Promotor inválido ou fora da operação.');
      if (stores.length !== storeIds.length) throw new ManualRouteError('INVALID_ROUTE', 400, 'Loja inválida ou arquivada.');
      if (industries.length !== industryIds.length) throw new ManualRouteError('INVALID_ROUTE', 400, 'Indústria inválida ou arquivada.');
      if (batch.upserts.some((item) => item.industryIds.length === 0 || item.routeOrder < 1 || item.weeklyFrequency < 1 || new Date(item.scheduledDate).getUTCDay() === 0)) {
        throw new ManualRouteError('INVALID_ROUTE', 400, 'Dia, ordem, frequência ou indústrias inválidos.');
      }
      for (const input of batch.upserts) {
        const operation = operations.find((item) => item.id === input.operationId)!;
        const date = new Date(input.scheduledDate);
        if (operation.name !== 'MK9 - OPERAÇÃO PADRÃO') {
          if (date < operation.startsAt || date > operation.endsAt) throw new ManualRouteError('INVALID_ROUTE', 400, 'A data está fora do período da operação.');
          const promoter = promoters.find((item) => item.id === input.promoterId)!;
          if (promoter.operationId && promoter.operationId !== input.operationId) throw new ManualRouteError('INVALID_ROUTE', 400, 'Promotor fora da operação.');
        }
      }
      const inputIds = batch.upserts.map((item) => item.id).filter((id): id is string => Boolean(id));
      const dates = batch.upserts.map((item) => new Date(item.scheduledDate).getTime());
      const existing = dates.length ? await tx.visit.findMany({
        where: {
          operationId: { in: operationIds },
          promoterId: { in: promoterIds },
          scheduledDate: { gte: new Date(Math.min(...dates) - 86_400_000), lte: new Date(Math.max(...dates) + 86_400_000) },
          id: { notIn: [...inputIds, ...batch.deleteIds] },
        },
      }) : [];
      const existingDraft: ManualVisitInput[] = existing.map((item) => ({
        id: item.id, operationId: item.operationId, promoterId: item.promoterId, storeId: item.storeId,
        industryIds: [item.industryId], scheduledDate: item.scheduledDate.toISOString(),
        routeOrder: item.routeOrder ?? 1, weeklyFrequency: item.weeklyFrequency,
        plannedTime: item.plannedTime, estimatedDurationMinutes: item.estimatedDurationMinutes,
        notes: item.notes, status: item.status, conflictJustification: item.manualOverrideReason ?? undefined,
      }));
      const offset = existingDraft.length;
      const conflicts = validateWeeklyRouteDraft([...existingDraft, ...batch.upserts])
        .filter((conflict) => conflict.inputIndex >= offset)
        .map((conflict) => ({ ...conflict, inputIndex: conflict.inputIndex - offset }));
      const unjustified = conflicts.filter((conflict) => conflict.code === 'MULTIPLE_STORES_INDUSTRIES' && !batch.upserts[conflict.inputIndex]?.conflictJustification?.trim());
      const blocking = conflicts.filter((conflict) => conflict.code !== 'MULTIPLE_STORES_INDUSTRIES');
      if (blocking.length || unjustified.length) throw new ManualRouteError('ROUTE_CONFLICT', 409, 'O roteiro possui conflitos que precisam ser corrigidos ou justificados.', [...blocking, ...unjustified]);
      if (existingToDelete.some((item) => item.status !== 'PLANEJADA')) throw new ManualRouteError('ROUTE_FORBIDDEN', 403, 'Visitas realizadas não podem ser excluídas do roteiro.');

      const before = JSON.parse(JSON.stringify({ upserts: batch.upserts.map((item) => item.id).filter(Boolean), deleteIds: batch.deleteIds })) as Prisma.InputJsonValue;
      if (batch.deleteIds.length) {
        await tx.visitEvidence.updateMany({ where: { visitId: { in: batch.deleteIds } }, data: { visitId: null } });
        await tx.visit.deleteMany({ where: { id: { in: batch.deleteIds }, status: 'PLANEJADA' } });
      }
      let created = 0;
      let updated = 0;
      for (const input of batch.upserts) {
        const base = {
          operationId: input.operationId, promoterId: input.promoterId, storeId: input.storeId,
          scheduledDate: new Date(input.scheduledDate), routeOrder: input.routeOrder,
          weeklyFrequency: input.weeklyFrequency, plannedTime: input.plannedTime || null,
          estimatedDurationMinutes: input.estimatedDurationMinutes ?? null, notes: input.notes || null,
          manualOverrideReason: input.conflictJustification || null, status: input.status,
        };
        if (input.id) {
          const current = await tx.visit.findUnique({ where: { id: input.id }, select: { id: true, status: true, industryId: true } });
          if (!current) throw new ManualRouteError('ROUTE_NOT_FOUND', 404, 'Visita não encontrada.');
          if (current.status !== 'PLANEJADA' && input.status !== current.status) throw new ManualRouteError('ROUTE_FORBIDDEN', 403, 'Visitas realizadas não podem ser transformadas em planejamento.');
          const [firstIndustry, ...additional] = input.industryIds;
          await tx.visit.update({ where: { id: input.id }, data: { ...base, industryId: firstIndustry } as never });
          updated += 1;
          for (const industryId of additional.filter((id) => id !== firstIndustry)) {
            await tx.visit.create({ data: { ...base, industryId } as never });
            created += 1;
          }
        } else {
          for (const industryId of input.industryIds) {
            await tx.visit.create({ data: { ...base, industryId } as never });
            created += 1;
          }
        }
      }
      await tx.syncLog.create({
        data: {
          action: 'WEEKLY_ROUTE_BATCH_EDIT',
          status: 'SUCCESS',
          message: 'Roteiro semanal alterado manualmente.',
          details: { actor: 'ADMIN_DEV', origin: 'MANUAL', before, created, updated, deleted: batch.deleteIds.length, after: batch.upserts as unknown as Prisma.InputJsonValue },
        },
      });
      return { success: true as const, created, updated, deleted: batch.deleteIds.length, conflicts };
    }, { isolationLevel: 'Serializable', timeout: 60_000 });
  } catch (error) {
    if (error instanceof ManualRouteError) throw error;
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2022') throw new ManualRouteError('ROUTE_SAVE_FAILED', 500, 'A atualização do banco de dados ainda não foi aplicada. A edição do roteiro não pode ser salva neste ambiente.');
    console.error('[routes:manual] unexpected error', { name: error instanceof Error ? error.name : 'UnknownError', message: error instanceof Error ? error.message : String(error) });
    throw new ManualRouteError('ROUTE_SAVE_FAILED', 500, 'Não foi possível salvar o roteiro semanal.');
  }
}

export function copyPlannedWeek<T extends { status: VisitStatus; scheduledDate: string }>(visits: T[], daysOffset: number) {
  return visits.filter((item) => item.status === 'PLANEJADA').map((item) => ({
    ...item,
    scheduledDate: new Date(new Date(item.scheduledDate).getTime() + daysOffset * 86_400_000).toISOString(),
  }));
}
