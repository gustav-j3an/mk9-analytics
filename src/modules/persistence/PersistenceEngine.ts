import { prisma as defaultPrisma } from '@/lib/prisma';
import { Prisma, type PrismaClient } from '@prisma/client';
import type { PersistencePlan } from './PersistencePlan';
import type { PersistenceResult } from './PersistenceResult';

const WRITE_BATCH_SIZE = 200;

function batches<T>(items: T[]): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += WRITE_BATCH_SIZE) result.push(items.slice(index, index + WRITE_BATCH_SIZE));
  return result;
}

function developmentLog(event: string, details: Record<string, unknown>): void {
  if (process.env.NODE_ENV === 'development') console.info(`[imports:persistence-engine] ${event}`, details);
}

async function runBatchUpdate(tx: Prisma.TransactionClient, query: Prisma.Sql, fallback: () => Promise<void>) {
  if (typeof tx.$executeRaw === 'function') {
    await tx.$executeRaw(query);
    return;
  }
  await fallback();
}

export class PersistenceEngine {
  static async persist(
    plan: PersistencePlan,
    operationId: string,
    prisma: PrismaClient = defaultPrisma as unknown as PrismaClient
  ): Promise<PersistenceResult> {
    const startTime = Date.now();
    let lastEntity: { type: string; index: number } | null = null;

    const persistInTransaction = async (tx: Prisma.TransactionClient) => {
      developmentLog('start', {
        storesToCreate: plan.storesToCreate.length,
        storesToUpdate: plan.storesToUpdate.length,
        industriesToCreate: plan.industriesToCreate.length,
        industriesToUpdate: plan.industriesToUpdate.length,
        promotersToCreate: plan.promotersToCreate.length,
        promotersToUpdate: plan.promotersToUpdate.length,
        visitsToCreate: plan.visitsToCreate.length,
        visitsToUpdate: plan.visitsToUpdate.length,
      });
      // 1. Persistir Lojas
      const storesToCreate = plan.storesToCreate.map((store) => ({
            code: store.code,
            name: store.name,
            chain: store.chain,
            city: store.city,
            state: store.state,
      }));
      let stageStartedAt = Date.now();
      for (const [index, batch] of batches(storesToCreate).entries()) {
        lastEntity = { type: 'store.createMany', index };
        await tx.store.createMany({ data: batch, skipDuplicates: true });
      }
      developmentLog('store.createMany', { durationMs: Date.now() - stageStartedAt, rows: storesToCreate.length, batchSize: WRITE_BATCH_SIZE });

      stageStartedAt = Date.now();
      for (const [index, batch] of batches(plan.storesToUpdate).entries()) {
        lastEntity = { type: 'store.updateMany', index };
        await runBatchUpdate(
          tx,
          Prisma.sql`
            UPDATE "Store" AS target
            SET "name" = source.name::text, "chain" = source.chain::text,
                "city" = source.city::text, "state" = source.state::text,
                "updatedAt" = CURRENT_TIMESTAMP
            FROM (VALUES ${Prisma.join(batch.map((item) => Prisma.sql`(${item.code}, ${item.name}, ${item.chain}, ${item.city}, ${item.state})`))})
              AS source(code, name, chain, city, state)
            WHERE target."code" = source.code::text
          `,
          async () => {
            for (const item of batch) {
              await tx.store.updateMany({
                where: { code: item.code },
                data: { name: item.name, chain: item.chain, city: item.city, state: item.state },
              });
            }
          },
        );
      }
      developmentLog('store.updateMany', { durationMs: Date.now() - stageStartedAt, rows: plan.storesToUpdate.length, batchSize: WRITE_BATCH_SIZE });

      // 2. Persistir Indústrias
      const industriesToCreate = plan.industriesToCreate.map((ind) => ({
            code: ind.code,
            name: ind.name,
      }));
      stageStartedAt = Date.now();
      for (const [index, batch] of batches(industriesToCreate).entries()) {
        lastEntity = { type: 'industry.createMany', index };
        await tx.industry.createMany({ data: batch, skipDuplicates: true });
      }
      developmentLog('industry.createMany', { durationMs: Date.now() - stageStartedAt, rows: industriesToCreate.length, batchSize: WRITE_BATCH_SIZE });

      stageStartedAt = Date.now();
      for (const [index, batch] of batches(plan.industriesToUpdate).entries()) {
        lastEntity = { type: 'industry.updateMany', index };
        await runBatchUpdate(
          tx,
          Prisma.sql`
            UPDATE "Industry" AS target
            SET "name" = source.name::text, "updatedAt" = CURRENT_TIMESTAMP
            FROM (VALUES ${Prisma.join(batch.map((item) => Prisma.sql`(${item.code}, ${item.name})`))})
              AS source(code, name)
            WHERE target."code" = source.code::text
          `,
          async () => {
            for (const item of batch) {
              await tx.industry.updateMany({ where: { code: item.code }, data: { name: item.name } });
            }
          },
        );
      }
      developmentLog('industry.updateMany', { durationMs: Date.now() - stageStartedAt, rows: plan.industriesToUpdate.length, batchSize: WRITE_BATCH_SIZE });

      // 3. Persistir Promotores (resolvendo Supervisor em lote para evitar N+1)
      const uniqueSupervisorNames = Array.from(
        new Set([
          ...plan.promotersToCreate.map((p) => p.supervisor).filter(Boolean),
          ...plan.promotersToUpdate.map((p) => p.supervisor).filter(Boolean),
        ])
      ) as string[];

      if (!uniqueSupervisorNames.includes('SUPERVISOR PADRÃO')) {
        uniqueSupervisorNames.push('SUPERVISOR PADRÃO');
      }

      const dbSupervisors = await tx.supervisor.findMany({
        where: { name: { in: uniqueSupervisorNames } },
      });

      const supervisorMap = new Map<string, string>(
        dbSupervisors.map((s: any) => [s.name.toUpperCase(), s.id])
      );

      const missingSupervisors = uniqueSupervisorNames.filter(
        (name) => !supervisorMap.has(name.toUpperCase())
      );

      if (missingSupervisors.length > 0) {
        lastEntity = { type: 'supervisor.createMany', index: 0 };
        await tx.supervisor.createMany({
          data: missingSupervisors.map((name) => ({ name })),
        });
        const createdSupervisors = await tx.supervisor.findMany({
          where: { name: { in: missingSupervisors } },
        });
        for (const s of createdSupervisors) {
          supervisorMap.set(s.name.toUpperCase(), s.id);
        }
      }

      // Carregar os promotores existentes para atualização em lote
      const promoterNamesToUpdate = plan.promotersToUpdate.map((p) => p.name);
      const dbPromotersToUpdate = promoterNamesToUpdate.length > 0
        ? await tx.promoter.findMany({ where: { name: { in: promoterNamesToUpdate } } })
        : [];
      const dbPromotersToUpdateMap = new Map<string, string>(
        dbPromotersToUpdate.map((p: any) => [p.name.toUpperCase(), p.id])
      );

      const promotersToCreate = plan.promotersToCreate.map((promoter) => {
        const supervisorName = promoter.supervisor || 'SUPERVISOR PADRÃO';
        const supervisorId = supervisorMap.get(supervisorName.toUpperCase()) || '';
        return { name: promoter.name, supervisorId };
      });
      stageStartedAt = Date.now();
      for (const [index, batch] of batches(promotersToCreate).entries()) {
        lastEntity = { type: 'promoter.createMany', index };
        await tx.promoter.createMany({ data: batch, skipDuplicates: true });
      }
      developmentLog('promoter.createMany', { durationMs: Date.now() - stageStartedAt, rows: promotersToCreate.length, batchSize: WRITE_BATCH_SIZE });

      for (const [index, promoter] of plan.promotersToUpdate.entries()) {
        lastEntity = { type: 'promoter.update', index };
        const supervisorName = promoter.supervisor || 'SUPERVISOR PADRÃO';
        const supervisorId = supervisorMap.get(supervisorName.toUpperCase()) || '';
        const promoterId = dbPromotersToUpdateMap.get(promoter.name.toUpperCase());

        if (promoterId) {
          await tx.promoter.update({
            where: { id: promoterId },
            data: { supervisorId },
          });
        }
      }

      // 4. Mapear IDs para visitas
      const allStoreCodes = Array.from(
        new Set([
          ...plan.visitsToCreate.map((v) => v.store.code),
          ...plan.visitsToUpdate.map((v) => v.store.code),
        ])
      );
      const allIndustryCodes = Array.from(
        new Set([
          ...plan.visitsToCreate.map((v) => v.industry.code),
          ...plan.visitsToUpdate.map((v) => v.industry.code),
        ])
      );
      const allPromoterNames = Array.from(
        new Set([
          ...plan.visitsToCreate.map((v) => v.promoter?.name).filter(Boolean),
          ...plan.visitsToUpdate.map((v) => v.promoter?.name).filter(Boolean),
        ])
      ) as string[];

      const [dbStores, dbIndustries, dbPromoters, operation] = await Promise.all([
        allStoreCodes.length > 0
          ? tx.store.findMany({ where: { code: { in: allStoreCodes } } })
          : Promise.resolve([]),
        allIndustryCodes.length > 0
          ? tx.industry.findMany({ where: { code: { in: allIndustryCodes } } })
          : Promise.resolve([]),
        allPromoterNames.length > 0
          ? tx.promoter.findMany({ where: { name: { in: allPromoterNames } } })
          : Promise.resolve([]),
        tx.operation.findUnique({ where: { id: operationId } }),
      ]);

      if (!operation) {
        throw new Error(`Operação com ID ${operationId} não encontrada no banco.`);
      }

      const storeMap = new Map(dbStores.map((s: any) => [s.code, s.id]));
      const industryMap = new Map(dbIndustries.map((i: any) => [i.code, i.id]));
      const promoterMap = new Map(dbPromoters.map((p: any) => [p.name.toUpperCase(), p.id]));

      // Carregar/criar promotor padrão uma única vez se houver visitas sem promotor
      let defaultPromoterId = '';
      let createdDefaultPromoters = 0;
      const hasVisitsWithoutPromoter =
        plan.visitsToCreate.some((v) => !v.promoter) || plan.visitsToUpdate.some((v) => !v.promoter);

      if (hasVisitsWithoutPromoter) {
        let defaultPromoter = await tx.promoter.findFirst({
          where: { name: 'PROMOTOR PADRÃO' },
        });
        if (!defaultPromoter) {
          const defaultSupId = supervisorMap.get('SUPERVISOR PADRÃO') || '';
          lastEntity = { type: 'promoter.default.create', index: 0 };
          defaultPromoter = await tx.promoter.create({
            data: {
              name: 'PROMOTOR PADRÃO',
              supervisorId: defaultSupId,
            },
          });
          createdDefaultPromoters = 1;
        }
        defaultPromoterId = defaultPromoter.id;
      }

      // 5. Persistir Visitas Criadas
      const visitsToCreate: Prisma.VisitCreateManyInput[] = plan.visitsToCreate.map((cv, index) => {
        const storeId = storeMap.get(cv.store.code);
        const industryId = industryMap.get(cv.industry.code);
        let promoterId = cv.promoter ? promoterMap.get(cv.promoter.name.toUpperCase()) : null;

        if (!storeId || !industryId) {
          throw new Error(
            `Erro de integridade: Loja (${cv.store.code}) ou Indústria (${cv.industry.code}) não cadastrada.`
          );
        }

        if (!promoterId) {
          promoterId = defaultPromoterId;
        }

        const scheduledDate = cv.scheduledDate ? new Date(cv.scheduledDate) : new Date(operation.startsAt);
        if (!cv.scheduledDate) scheduledDate.setDate(scheduledDate.getDate() + (cv.plannedVisitIndex - 1));
        if (Number.isNaN(scheduledDate.getTime())) throw new Error(`Data inválida no candidato de visita ${index}.`);
        if (!promoterId) throw new Error(`Promotor não resolvido no candidato de visita ${index}.`);
        return {
            operationId,
            storeId,
            industryId,
            promoterId,
            scheduledDate,
            status: cv.completed ? 'REALIZADA' : 'PLANEJADA',
            completedDate: cv.completed ? scheduledDate : null,
        };
      });
      stageStartedAt = Date.now();
      for (const [index, batch] of batches(visitsToCreate).entries()) {
        lastEntity = { type: 'visit.createMany', index };
        await tx.visit.createMany({ data: batch });
      }
      developmentLog('visit.createMany', { durationMs: Date.now() - stageStartedAt, rows: visitsToCreate.length, batchSize: WRITE_BATCH_SIZE });

      // 6. Persistir Visitas Atualizadas
      const existingVisits = await tx.visit.findMany({
        where: { operationId },
        include: { store: true, industry: true, promoter: true },
      });

      const visitUpdateGroups = new Map<string, { ids: string[]; promoterId: string; completedDate: Date | null; status: 'REALIZADA' | 'PLANEJADA' }>();
      for (const [index, cv] of plan.visitsToUpdate.entries()) {
        const storeCode = cv.store.code;
        const industryCode = cv.industry.code;
        const promoterName = cv.promoter?.name?.toUpperCase() || 'NO_PROMOTER';
        const targetDate = cv.scheduledDate ? new Date(cv.scheduledDate) : new Date(operation.startsAt);
        if (!cv.scheduledDate) targetDate.setDate(targetDate.getDate() + (cv.plannedVisitIndex - 1));
        const existingVisit = existingVisits.find((visit) => {
          const existingPromoter = visit.promoter?.name?.toUpperCase() || 'NO_PROMOTER';
          const normalizedPromoter = existingPromoter === 'PROMOTOR PADRÃO' ? 'NO_PROMOTER' : existingPromoter;
          return visit.store?.code === storeCode
            && visit.industry?.code === industryCode
            && normalizedPromoter === promoterName
            && visit.scheduledDate.toISOString().slice(0, 10) === targetDate.toISOString().slice(0, 10);
        });

        if (existingVisit) {
          let promoterId = cv.promoter ? promoterMap.get(cv.promoter.name.toUpperCase()) : null;

          if (!promoterId) {
            promoterId = defaultPromoterId;
          }
          if (!promoterId) throw new Error(`Promotor não resolvido no candidato de atualização ${index}.`);
          if (Number.isNaN(targetDate.getTime())) throw new Error(`Data inválida no candidato de atualização ${index}.`);
          const status = cv.completed ? 'REALIZADA' as const : 'PLANEJADA' as const;
          const completedDate = cv.completed ? targetDate : null;
          const groupKey = `${promoterId}:${status}:${completedDate?.toISOString() ?? 'NULL'}`;
          let group = visitUpdateGroups.get(groupKey);
          if (!group) {
            group = { ids: [], promoterId, completedDate, status };
            visitUpdateGroups.set(groupKey, group);
          }
          group.ids.push(existingVisit.id);
        }
      }

      stageStartedAt = Date.now();
      for (const [index, group] of [...visitUpdateGroups.values()].entries()) {
        lastEntity = { type: 'visit.updateMany', index };
        await tx.visit.updateMany({
          where: { id: { in: group.ids } },
          data: { promoterId: group.promoterId, status: group.status, completedDate: group.completedDate },
        });
      }
      developmentLog('visit.updateMany', { durationMs: Date.now() - stageStartedAt, rows: plan.visitsToUpdate.length, groups: visitUpdateGroups.size });

      const durationMs = Date.now() - startTime;

      const result = {
        createdStores: plan.storesToCreate.length,
        updatedStores: plan.storesToUpdate.length,
        createdIndustries: plan.industriesToCreate.length,
        updatedIndustries: plan.industriesToUpdate.length,
        createdPromoters: plan.promotersToCreate.length + createdDefaultPromoters,
        updatedPromoters: plan.promotersToUpdate.length,
        createdVisits: plan.visitsToCreate.length,
        updatedVisits: plan.visitsToUpdate.length,
        durationMs,
      };
      developmentLog('complete', result);
      return result;
    };

    try {
      if ('$transaction' in prisma && typeof prisma.$transaction === 'function') {
        return await prisma.$transaction((tx) => persistInTransaction(tx));
      }
      return await persistInTransaction(prisma as unknown as Prisma.TransactionClient);
    } catch (error) {
      developmentLog('failed', {
        lastEntity,
        name: error instanceof Error ? error.name : 'UnknownError',
        message: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
