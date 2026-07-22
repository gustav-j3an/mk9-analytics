import assert from 'node:assert/strict';
import test from 'node:test';
import { PersistenceEngine } from './PersistenceEngine';
import type { PersistencePlan } from './PersistencePlan';
import type { StoreCandidate } from '../mapping/store/StoreCandidate';
import type { IndustryCandidate } from '../mapping/industry/IndustryCandidate';
import type { PromoterCandidate } from '../mapping/promoter/PromoterCandidate';
import type { VisitCandidate } from '../mapping/visit/VisitCandidate';

const createStore = (code: string): StoreCandidate => ({
  code,
  name: `Store ${code}`,
  chain: null,
  city: 'SP',
  state: 'SP',
  neighborhood: null,
  isValid: true,
  errors: [],
  deduplicationKey: `CODE:${code}`,
  originalData: {},
});

const createIndustry = (code: string): IndustryCandidate => ({
  code,
  name: `Industry ${code}`,
  normalizedName: `INDUSTRY ${code}`,
  active: true,
  isValid: true,
  errors: [],
  deduplicationKey: `CODE:${code}`,
  originalData: {},
});

const createPromoter = (name: string, supervisor: string | null = null): PromoterCandidate => ({
  name,
  normalizedName: name.toUpperCase(),
  supervisor,
  active: true,
  isValid: true,
  errors: [],
  deduplicationKey: `NAME:${name.toUpperCase()}`,
  originalData: {},
});

const createVisit = (storeCode: string, industryCode: string, promoterName: string, index: number): VisitCandidate => ({
  store: createStore(storeCode),
  industry: createIndustry(industryCode),
  promoter: createPromoter(promoterName),
  frequency: 4,
  frequencyType: 'WEEKLY',
  plannedVisitIndex: index,
  deduplicationKey: `VISIT:${storeCode}:${industryCode}:${promoterName.toUpperCase()}:${index}`,
  originalData: {},
});

class MockDatabase {
  stores: any[] = [];
  industries: any[] = [];
  promoters: any[] = [];
  supervisors: any[] = [];
  visits: any[] = [];
  operations: any[] = [{ id: 'op-1', startsAt: new Date('2026-07-01') }];

  createSnapshot() {
    return {
      stores: structuredClone(this.stores),
      industries: structuredClone(this.industries),
      promoters: structuredClone(this.promoters),
      supervisors: structuredClone(this.supervisors),
      visits: structuredClone(this.visits),
    };
  }

  restoreSnapshot(snapshot: any) {
    this.stores = snapshot.stores;
    this.industries = snapshot.industries;
    this.promoters = snapshot.promoters;
    this.supervisors = snapshot.supervisors;
    this.visits = snapshot.visits;
  }
}

const createPrismaMock = (db: MockDatabase) => {
  const txMock = {
    store: {
      createMany: async (args: any) => {
        for (const data of args.data) db.stores.push({ id: `s-${db.stores.length + 1}`, ...data });
        return { count: args.data.length };
      },
      create: async (args: any) => {
        db.stores.push({ id: `s-${db.stores.length + 1}`, ...args.data });
      },
      update: async (args: any) => {
        const item = db.stores.find((s) => s.code === args.where.code);
        if (item) Object.assign(item, args.data);
      },
      updateMany: async (args: any) => {
        const item = db.stores.find((s) => s.code === args.where.code);
        if (item) Object.assign(item, args.data);
        return { count: item ? 1 : 0 };
      },
      findMany: async (args: any) => {
        if (args?.where?.code?.in) {
          return db.stores.filter((s) => args.where.code.in.includes(s.code));
        }
        return db.stores;
      },
    },
    industry: {
      createMany: async (args: any) => {
        for (const data of args.data) db.industries.push({ id: `i-${db.industries.length + 1}`, ...data });
        return { count: args.data.length };
      },
      create: async (args: any) => {
        db.industries.push({ id: `i-${db.industries.length + 1}`, ...args.data });
      },
      update: async (args: any) => {
        const item = db.industries.find((i) => i.code === args.where.code);
        if (item) Object.assign(item, args.data);
      },
      updateMany: async (args: any) => {
        const item = db.industries.find((i) => i.code === args.where.code);
        if (item) Object.assign(item, args.data);
        return { count: item ? 1 : 0 };
      },
      findMany: async (args: any) => {
        if (args?.where?.code?.in) {
          return db.industries.filter((i) => args.where.code.in.includes(i.code));
        }
        return db.industries;
      },
    },
    supervisor: {
      findMany: async (args: any) => {
        if (args?.where?.name?.in) return db.supervisors.filter((s) => args.where.name.in.includes(s.name));
        return db.supervisors;
      },
      createMany: async (args: any) => {
        for (const data of args.data) db.supervisors.push({ id: `sup-${db.supervisors.length + 1}`, ...data });
        return { count: args.data.length };
      },
      create: async (args: any) => {
        const s = { id: `sup-${db.supervisors.length + 1}`, ...args.data };
        db.supervisors.push(s);
        return s;
      },
      findFirst: async (args: any) => {
        return db.supervisors.find((s) => s.name === args.where.name) || null;
      },
    },
    promoter: {
      createMany: async (args: any) => {
        for (const data of args.data) db.promoters.push({ id: `p-${db.promoters.length + 1}`, ...data });
        return { count: args.data.length };
      },
      create: async (args: any) => {
        const p = { id: `p-${db.promoters.length + 1}`, ...args.data };
        db.promoters.push(p);
        return p;
      },
      update: async (args: any) => {
        const item = db.promoters.find((p) => p.id === args.where.id);
        if (item) Object.assign(item, args.data);
      },
      findFirst: async (args: any) => {
        return db.promoters.find((p) => p.name === args.where.name) || null;
      },
      findMany: async (args: any) => {
        if (args?.where?.name?.in) {
          return db.promoters.filter((p) => args.where.name.in.includes(p.name));
        }
        return db.promoters;
      },
    },
    operation: {
      findUnique: async (args: any) => {
        return db.operations.find((op) => op.id === args.where.id) || null;
      },
    },
    visit: {
      createMany: async (args: any) => {
        for (const data of args.data) {
          const store = db.stores.find((s) => s.id === data.storeId);
          const industry = db.industries.find((i) => i.id === data.industryId);
          const promoter = db.promoters.find((p) => p.id === data.promoterId);
          db.visits.push({ id: `v-${db.visits.length + 1}`, ...data, store, industry, promoter });
        }
        return { count: args.data.length };
      },
      create: async (args: any) => {
        const store = db.stores.find((s) => s.id === args.data.storeId);
        const industry = db.industries.find((i) => i.id === args.data.industryId);
        const promoter = db.promoters.find((p) => p.id === args.data.promoterId);
        db.visits.push({
          id: `v-${db.visits.length + 1}`,
          ...args.data,
          store,
          industry,
          promoter,
        });
      },
      update: async (args: any) => {
        const item = db.visits.find((v) => v.id === args.where.id);
        if (item) {
          Object.assign(item, args.data);
          if (args.data.promoterId) {
            item.promoter = db.promoters.find((p) => p.id === args.data.promoterId);
          }
        }
      },
      updateMany: async (args: any) => {
        const ids = args.where.id.in as string[];
        const matches = db.visits.filter((visit) => ids.includes(visit.id));
        for (const item of matches) Object.assign(item, args.data);
        return { count: matches.length };
      },
      findMany: async (args: any) => {
        return db.visits.filter((v) => v.operationId === args.where.operationId);
      },
    },
  };

  return {
    $transaction: async (fn: (tx: any) => Promise<any>) => {
      const snapshot = db.createSnapshot();
      try {
        return await fn(txMock);
      } catch (err) {
        db.restoreSnapshot(snapshot);
        throw err;
      }
    },
  };
};

test('operação totalmente nova', async () => {
  const db = new MockDatabase();
  const plan: PersistencePlan = {
    storesToCreate: [createStore('S1')],
    storesToUpdate: [],
    industriesToCreate: [createIndustry('I1')],
    industriesToUpdate: [],
    promotersToCreate: [createPromoter('P1', 'Sup A')],
    promotersToUpdate: [],
    visitsToCreate: [createVisit('S1', 'I1', 'P1', 1)],
    visitsToUpdate: [],
  };

  const prismaMock = createPrismaMock(db);
  const result = await PersistenceEngine.persist(plan, 'op-1', prismaMock as any);

  assert.equal(result.createdStores, 1);
  assert.equal(result.createdVisits, 1);
  assert.equal(result.createdPromoters, 1);
  assert.equal(db.stores.length, 1);
  assert.equal(db.visits.length, 1);
  assert.equal(db.supervisors.length, 2);
});

test('rollback em erro', async () => {
  const db = new MockDatabase();
  const plan: PersistencePlan = {
    storesToCreate: [createStore('S1')],
    storesToUpdate: [],
    industriesToCreate: [],
    industriesToUpdate: [],
    promotersToCreate: [],
    promotersToUpdate: [],
    visitsToCreate: [createVisit('INVALID_STORE', 'INVALID_INDUSTRY', 'P1', 1)], // Lançará erro
    visitsToUpdate: [],
  };

  const prismaMock = createPrismaMock(db);
  await assert.rejects(
    PersistenceEngine.persist(plan, 'op-1', prismaMock as any),
    /Erro de integridade/
  );

  // Garante que o rollback desfez a criação da loja SMC001
  assert.equal(db.stores.length, 0);
  assert.equal(db.visits.length, 0);
});

test('estatísticas e atomicidade', async () => {
  const db = new MockDatabase();
  // Preencher base existente
  db.stores.push({ id: 's-existing-1', code: 'S1', name: 'Original Store' });
  db.promoters.push({ id: 'p-existing-1', name: 'P1', supervisorId: 'sup-1' });

  const plan: PersistencePlan = {
    storesToCreate: [createStore('S2')],
    storesToUpdate: [createStore('S1')],
    industriesToCreate: [createIndustry('I1')],
    industriesToUpdate: [],
    promotersToCreate: [],
    promotersToUpdate: [createPromoter('P1', 'Sup Novo')],
    visitsToCreate: [createVisit('S1', 'I1', 'P1', 1)],
    visitsToUpdate: [],
  };

  const prismaMock = createPrismaMock(db);
  const result = await PersistenceEngine.persist(plan, 'op-1', prismaMock as any);

  assert.equal(result.createdStores, 1);
  assert.equal(result.updatedStores, 1);
  assert.equal(result.updatedPromoters, 1);
  assert.equal(result.createdVisits, 1);

  assert.equal(db.stores.find((s) => s.code === 'S1').name, 'Store S1');
});
