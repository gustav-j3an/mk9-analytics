import { prisma } from '@/lib/prisma';
import type { Prisma, Visit } from '@prisma/client';
import { getDatesForWeekdayInMonth } from '../utils/date-utils';
import { canonicalize } from '@/modules/shared/normalization';
import { getOrCreateDefaultOperationForPeriod } from '@/lib/defaultOperation';
import { isVisitMarked } from '../utils/visit-markers';

// Levenshtein helper for similarity check
function levenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function getSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1.0;
  return (maxLength - levenshteinDistance(a, b)) / maxLength;
}

export function normalizeStringForComparison(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

export interface SyncAnalysisInput {
  rows: any[]; // normalized spreadsheet rows
  auxiliary?: {
    promoters?: any[];
    stores?: any[];
    industries?: any[];
  };
  month: number;
  year: number;
  syncMode: 'FULL_SYNC' | 'ADD_ONLY';
}

export interface RouteAnalysisItem {
  aba: string;
  sourceRow: number;
  industry: string;
  store: string;
  uf: string;
  promoter: string;
  weekday: string;
  date: string;
  status: 'NOVO' | 'SEM_ALTERACAO' | 'ALTERADO' | 'REMOVIDO_DA_PLANILHA' | 'DUPLICADO' | 'CONFLITO' | 'PROMOTER_NOVO' | 'STORE_NOVA' | 'INDUSTRIA_NOVA' | 'AMBIGUO';
  action: 'CREATE' | 'KEEP' | 'UPDATE' | 'DELETE' | 'CANCEL' | 'IGNORE';
  details?: string;
}

export interface SyncAnalysisPreview {
  linesRead: number;
  linesValid: number;
  linesInvalid: number;
  sheetsAnalyzed: string[];
  promotersFound: number;
  promotersNew: number;
  storesFound: number;
  storesNew: number;
  industriesFound: number;
  industriesNew: number;
  routesNew: number;
  routesUpdated: number;
  routesKept: number;
  routesRemoved: number;
  realizedPreserved: number;
  conflitos: number;
  duplicidades: number;
  items: RouteAnalysisItem[];
  promoterMappings: Record<string, { dbId?: string; isNew: boolean; isAmbiguous?: boolean; similarName?: string; city?: string; phone?: string }>;
  storeMappings: Record<string, { dbId?: string; isNew: boolean; isAmbiguous?: boolean; similarName?: string; city?: string; state?: string; chain?: string }>;
  industryMappings: Record<string, { dbId?: string; isNew: boolean; isAmbiguous?: boolean; similarName?: string; code?: string }>;
}

export class RoteiroSyncService {
  static async analyze(input: SyncAnalysisInput, txClient?: Prisma.TransactionClient): Promise<SyncAnalysisPreview> {
    const { rows, auxiliary, month, year, syncMode } = input;
    const client = txClient || prisma;

    // 1. Fetch DB entities
    const dbPromoters = await client.promoter.findMany({ where: { deletedAt: null } });
    const dbStores = await client.store.findMany({ where: { archivedAt: null } });
    const dbIndustries = await client.industry.findMany({ where: { archivedAt: null } });

    // 2. Fetch existing visits for month/year (via default operation)
    const operationId = await getOrCreateDefaultOperationForPeriod(month, year);
    const dbVisits = await client.visit.findMany({
      where: { operationId },
      include: { store: true, industry: true, promoter: true }
    });

    const sheetsSet = new Set<string>();
    rows.forEach(r => { if (r.ABA) sheetsSet.add(r.ABA); });

    // 3. Resolve Mappings (Promoters, Stores, Industries)
    const promoterMappings: Record<string, any> = {};
    const storeMappings: Record<string, any> = {};
    const industryMappings: Record<string, any> = {};

    let promotersFound = 0;
    let promotersNew = 0;
    let storesFound = 0;
    let storesNew = 0;
    let industriesFound = 0;
    let industriesNew = 0;

    // Promoter Resolution
    const rowPromoterNames = Array.from(new Set(rows.map(r => String(r.PROMOTOR || r.PROMOTORES || '').trim()).filter(Boolean)));
    for (const name of rowPromoterNames) {
      const norm = normalizeStringForComparison(name);
      // Try exact normalized match
      const dbMatch = dbPromoters.find(p => normalizeStringForComparison(p.name) === norm);
      if (dbMatch) {
        promotersFound++;
        promoterMappings[name] = { dbId: dbMatch.id, isNew: false };
      } else {
        // Check for similar name (ambiguity)
        const similar = dbPromoters.find(p => getSimilarity(normalizeStringForComparison(p.name), norm) >= 0.85);
        if (similar) {
          promoterMappings[name] = { dbId: similar.id, isNew: false, isAmbiguous: true, similarName: similar.name };
        } else {
          promotersNew++;
          // Look in auxiliary sheet
          const aux = auxiliary?.promoters?.find(p => normalizeStringForComparison(p.name) === norm);
          promoterMappings[name] = {
            isNew: true,
            city: aux?.city,
            phone: aux?.phone || aux?.contato,
            state: aux?.state
          };
        }
      }
    }

    // Store Resolution
    const rowStoreNames = Array.from(new Set(rows.map(r => String(r.LOJA || '').trim()).filter(Boolean)));
    for (const name of rowStoreNames) {
      const norm = normalizeStringForComparison(name);
      const dbMatch = dbStores.find(s => normalizeStringForComparison(s.name) === norm);
      if (dbMatch) {
        storesFound++;
        storeMappings[name] = { dbId: dbMatch.id, isNew: false };
      } else {
        const similar = dbStores.find(s => getSimilarity(normalizeStringForComparison(s.name), norm) >= 0.85);
        if (similar) {
          storeMappings[name] = { dbId: similar.id, isNew: false, isAmbiguous: true, similarName: similar.name };
        } else {
          storesNew++;
          const aux = auxiliary?.stores?.find(s => normalizeStringForComparison(s.name) === norm);
          storeMappings[name] = {
            isNew: true,
            city: aux?.city,
            state: aux?.state || aux?.uf,
            chain: aux?.chain || aux?.rede
          };
        }
      }
    }

    // Industry Resolution
    const rowIndustryNames = Array.from(new Set(rows.map(r => String(r.INDUSTRIA || '').trim()).filter(Boolean)));
    for (const name of rowIndustryNames) {
      const norm = normalizeStringForComparison(name);
      const dbMatch = dbIndustries.find(i => normalizeStringForComparison(i.name) === norm);
      if (dbMatch) {
        industriesFound++;
        industryMappings[name] = { dbId: dbMatch.id, isNew: false };
      } else {
        const similar = dbIndustries.find(i => getSimilarity(normalizeStringForComparison(i.name), norm) >= 0.85);
        if (similar) {
          industryMappings[name] = { dbId: similar.id, isNew: false, isAmbiguous: true, similarName: similar.name };
        } else {
          industriesNew++;
          const aux = auxiliary?.industries?.find(i => normalizeStringForComparison(i.name) === norm);
          industryMappings[name] = {
            isNew: true,
            code: aux?.code || canonicalize(name)
          };
        }
      }
    }

    // 4. Generate visits from spreadsheet
    const plannedVisits: any[] = [];
    const weekdays = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'];

    let duplicidadesCount = 0;
    const seenVisits = new Set<string>();

    rows.forEach(r => {
      const pName = String(r.PROMOTOR || r.PROMOTORES || '').trim();
      const sName = String(r.LOJA || '').trim();
      const iName = String(r.INDUSTRIA || '').trim();
      if (!pName || !sName || !iName) return;

      const weeklyFreq = Math.max(1, Math.trunc(Number(r.VISITA_SEMANAL) || 0));

      weekdays.forEach(wd => {
        if (isVisitMarked(r[wd])) {
          const dates = getDatesForWeekdayInMonth(year, month, wd);
          dates.forEach(d => {
            const dateStr = d.toISOString().slice(0, 10);
            const key = `${normalizeStringForComparison(pName)}:${normalizeStringForComparison(sName)}:${normalizeStringForComparison(iName)}:${dateStr}`;

            if (seenVisits.has(key)) {
              duplicidadesCount++;
              return;
            }
            seenVisits.add(key);

            plannedVisits.push({
              aba: r.ABA || 'Planilha',
              sourceRow: Number(r.SOURCE_ROW_NUMBER || 0),
              promoterName: pName,
              storeName: sName,
              industryName: iName,
              weekday: wd,
              date: d,
              dateStr,
              weeklyFreq
            });
          });
        }
      });
    });

    // 5. Compare plannedVisits against dbVisits
    const dbVisitsMap = new Map<string, Visit & { store: any; industry: any; promoter: any }>();
    dbVisits.forEach(v => {
      const key = `${v.promoterId}:${v.storeId}:${v.industryId}:${v.scheduledDate.toISOString().slice(0, 10)}`;
      dbVisitsMap.set(key, v as any);
    });

    const items: RouteAnalysisItem[] = [];
    let routesNew = 0;
    let routesUpdated = 0;
    let routesKept = 0;
    let routesRemoved = 0;
    let realizedPreserved = 0;
    let conflitosCount = 0;

    // Process spreadsheet visits
    const matchedDbKeys = new Set<string>();

    for (const pv of plannedVisits) {
      const promoterMap = promoterMappings[pv.promoterName];
      const storeMap = storeMappings[pv.storeName];
      const industryMap = industryMappings[pv.industryName];

      const isNewEntity = promoterMap?.isNew || storeMap?.isNew || industryMap?.isNew;
      const isAmbiguous = promoterMap?.isAmbiguous || storeMap?.isAmbiguous || industryMap?.isAmbiguous;

      let status: RouteAnalysisItem['status'] = 'NOVO';
      let action: RouteAnalysisItem['action'] = 'CREATE';
      let details = '';

      if (isNewEntity) {
        if (promoterMap?.isNew) status = 'PROMOTER_NOVO';
        else if (storeMap?.isNew) status = 'STORE_NAO_ENCONTRADA' as any; // Map to UI label
        else status = 'INDUSTRIA_NOVA';
        action = 'CREATE';
        details = 'Cadastro não encontrado no banco de dados. Será criado.';
      } else if (isAmbiguous) {
        status = 'AMBIGUO';
        action = 'IGNORE';
        details = 'Nome muito semelhante a um cadastro existente. Revisão recomendada.';
      } else {
        const promId = promoterMap?.dbId;
        const storeId = storeMap?.dbId;
        const indId = industryMap?.dbId;
        const dbKey = `${promId}:${storeId}:${indId}:${pv.dateStr}`;
        const dbMatch = dbVisitsMap.get(dbKey);

        if (dbMatch) {
          matchedDbKeys.add(dbKey);
          if (dbMatch.weeklyFrequency !== pv.weeklyFreq) {
            status = 'ALTERADO';
            action = 'UPDATE';
            details = `Frequência semanal alterada de ${dbMatch.weeklyFrequency} para ${pv.weeklyFreq}.`;
            routesUpdated++;
          } else {
            status = 'SEM_ALTERACAO';
            action = 'KEEP';
            details = 'Roteiro idêntico ao cadastrado no banco.';
            routesKept++;
          }
        } else {
          status = 'NOVO';
          action = 'CREATE';
          details = 'Nova rota planejada.';
          routesNew++;
        }
      }

      // Check for promoter schedule conflict (same day, different store + industry)
      const hasConflict = plannedVisits.some(other =>
        other !== pv &&
        normalizeStringForComparison(other.promoterName) === normalizeStringForComparison(pv.promoterName) &&
        other.dateStr === pv.dateStr &&
        (normalizeStringForComparison(other.storeName) !== normalizeStringForComparison(pv.storeName) ||
         normalizeStringForComparison(other.industryName) !== normalizeStringForComparison(pv.industryName))
      );

      if (hasConflict) {
        conflitosCount++;
        status = 'CONFLITO';
        details = 'Promotor alocado em lojas/indústrias diferentes no mesmo dia.';
      }

      items.push({
        aba: pv.aba,
        sourceRow: pv.sourceRow,
        industry: pv.industryName,
        store: pv.storeName,
        uf: promoterMap?.state || storeMap?.state || 'MS',
        promoter: pv.promoterName,
        weekday: pv.weekday,
        date: pv.dateStr,
        status,
        action,
        details
      });
    }

    // Process database visits that are missing in spreadsheet (REMOVALS)
    if (syncMode === 'FULL_SYNC') {
      for (const [key, dbv] of dbVisitsMap.entries()) {
        if (!matchedDbKeys.has(key)) {
          routesRemoved++;
          const isRealized = dbv.status === 'REALIZADA' || dbv.completedAt !== null;

          if (isRealized) {
            realizedPreserved++;
            items.push({
              aba: 'Banco de Dados',
              sourceRow: 0,
              industry: dbv.industry.name,
              store: dbv.store.name,
              uf: dbv.store.state || 'MS',
              promoter: dbv.promoter.name,
              weekday: getWeekdayLabel(dbv.scheduledDate),
              date: dbv.scheduledDate.toISOString().slice(0, 10),
              status: 'VISITA_JÁ_REALIZADA' as any,
              action: 'KEEP',
              details: 'Visita já realizada ou com evidências. Preservada intacta.'
            });
          } else {
            items.push({
              aba: 'Banco de Dados',
              sourceRow: 0,
              industry: dbv.industry.name,
              store: dbv.store.name,
              uf: dbv.store.state || 'MS',
              promoter: dbv.promoter.name,
              weekday: getWeekdayLabel(dbv.scheduledDate),
              date: dbv.scheduledDate.toISOString().slice(0, 10),
              status: 'REMOVIDO_DA_PLANILHA',
              action: 'DELETE',
              details: 'Não listado na planilha. Será removido do planejamento.'
            });
          }
        }
      }
    }

    return {
      linesRead: rows.length,
      linesValid: rows.length - duplicidadesCount,
      linesInvalid: 0,
      sheetsAnalyzed: Array.from(sheetsSet),
      promotersFound,
      promotersNew,
      storesFound,
      storesNew,
      industriesFound,
      industriesNew,
      routesNew,
      routesUpdated,
      routesKept,
      routesRemoved,
      realizedPreserved,
      conflitos: conflitosCount,
      duplicidades: duplicidadesCount,
      items,
      promoterMappings,
      storeMappings,
      industryMappings
    };
  }

  static async persist(
    input: SyncAnalysisInput,
    userId: string,
    importId: string,
    txClient?: Prisma.TransactionClient
  ): Promise<any> {
    const run = async (tx: Prisma.TransactionClient) => {
      console.info(`[RoteiroSyncService:persist] Starting persistence. syncMode=${input.syncMode}, month=${input.month}, year=${input.year}`);
      
      const analysis = await this.analyze(input, tx);
      console.info(`[RoteiroSyncService:persist] Analysis complete. promotersNew=${analysis.promotersNew}, storesNew=${analysis.storesNew}, industriesNew=${analysis.industriesNew}`);

      const operationId = await getOrCreateDefaultOperationForPeriod(input.month, input.year);

      // Fetch default supervisor
      let supervisor = await tx.supervisor.findFirst();
      if (!supervisor) {
        supervisor = await tx.supervisor.create({
          data: { name: 'Supervisor Geral', email: 'supervisor@mk9.com' }
        });
      }

      // Create new industries
      for (const [name, map] of Object.entries(analysis.industryMappings)) {
        const value = map as any;
        if (value.isNew) {
          const created = await tx.industry.create({
            data: { name, code: value.code || canonicalize(name) }
          });
          value.dbId = created.id;
        }
      }

      // Create new stores
      for (const [name, map] of Object.entries(analysis.storeMappings)) {
        const value = map as any;
        if (value.isNew) {
          const created = await tx.store.create({
            data: {
              name,
              code: canonicalize(name),
              city: value.city || 'Cidade',
              state: value.state || 'MS',
              chain: value.chain || 'Rede'
            }
          });
          value.dbId = created.id;
        }
      }

      // Create new promoters
      for (const [name, map] of Object.entries(analysis.promoterMappings)) {
        const value = map as any;
        if (value.isNew) {
          const created = await tx.promoter.create({
            data: {
              name,
              phone: value.phone || null,
              city: value.city || 'Cidade',
              state: value.state || 'MS',
              supervisorId: supervisor.id,
              status: 'ACTIVE'
            }
          });
          value.dbId = created.id;
        }
      }

      // Load existing visits in this period to perform memory-based deduplication and mapping
      const existingVisits = await tx.visit.findMany({
        where: { operationId },
        select: { id: true, promoterId: true, storeId: true, industryId: true, scheduledDate: true }
      });
      
      const existingVisitsSet = new Set(
        existingVisits.map(v => `${v.promoterId}:${v.storeId}:${v.industryId}:${v.scheduledDate.toISOString().slice(0, 10)}`)
      );

      // Perform updates/creations
      let createdVisits = 0;
      let updatedVisits = 0;
      let deletedVisits = 0;

      for (const item of analysis.items) {
        if (item.action === 'CREATE') {
          const promId = analysis.promoterMappings[item.promoter]?.dbId;
          const storeId = analysis.storeMappings[item.store]?.dbId;
          const indId = analysis.industryMappings[item.industry]?.dbId;

          if (!promId || !storeId || !indId) continue;

          const key = `${promId}:${storeId}:${indId}:${item.date}`;
          if (existingVisitsSet.has(key)) {
            // Update instead of create
            await tx.visit.updateMany({
              where: {
                operationId,
                promoterId: promId,
                storeId,
                industryId: indId,
                scheduledDate: new Date(`${item.date}T12:00:00.000Z`)
              },
              data: {
                weeklyFrequency: 1,
                status: 'PLANEJADA'
              }
            });
            updatedVisits++;
          } else {
            // Create
            await tx.visit.create({
              data: {
                operationId,
                promoterId: promId,
                storeId,
                industryId: indId,
                scheduledDate: new Date(`${item.date}T12:00:00.000Z`),
                weeklyFrequency: 1,
                status: 'PLANEJADA'
              }
            });
            createdVisits++;
            existingVisitsSet.add(key);
          }
        } else if (item.action === 'UPDATE') {
          const promId = analysis.promoterMappings[item.promoter]?.dbId;
          const storeId = analysis.storeMappings[item.store]?.dbId;
          const indId = analysis.industryMappings[item.industry]?.dbId;

          if (!promId || !storeId || !indId) continue;

          await tx.visit.updateMany({
            where: {
              operationId,
              promoterId: promId,
              storeId,
              industryId: indId,
              scheduledDate: new Date(`${item.date}T12:00:00.000Z`)
            },
            data: {
              weeklyFrequency: 1
            }
          });
          updatedVisits++;
        } else if (item.action === 'DELETE') {
          const promId = analysis.promoterMappings[item.promoter]?.dbId;
          const storeId = analysis.storeMappings[item.store]?.dbId;
          const indId = analysis.industryMappings[item.industry]?.dbId;

          if (!promId || !storeId || !indId) continue;

          // Hard delete PLANNED visits that are not realized
          const count = await tx.visit.deleteMany({
            where: {
              operationId,
              promoterId: promId,
              storeId,
              industryId: indId,
              scheduledDate: new Date(`${item.date}T12:00:00.000Z`),
              status: 'PLANEJADA',
              completedAt: null
            }
          });
          deletedVisits += count.count;
        }
      }

      // Update sync logs and import record
      await tx.import.update({
        where: { id: importId },
        data: {
          status: 'SUCCESS',
          operationId
        }
      });

      console.info(`[RoteiroSyncService:persist] Finished successfully. createdVisits=${createdVisits}, updatedVisits=${updatedVisits}, deletedVisits=${deletedVisits}`);

      return {
        createdVisits,
        updatedVisits,
        deletedVisits,
        promotersNew: analysis.promotersNew,
        storesNew: analysis.storesNew,
        industriesNew: analysis.industriesNew
      };
    };

    if (txClient) {
      return await run(txClient);
    } else {
      return await prisma.$transaction(async (tx) => {
        return await run(tx);
      }, {
        timeout: 30000
      });
    }
  }
}

function getWeekdayLabel(date: Date): string {
  const day = date.getUTCDay();
  const map = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  return map[day] || 'SEG';
}
