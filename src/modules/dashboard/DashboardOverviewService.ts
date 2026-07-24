import { prisma } from '@/lib/prisma';

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  industryId?: string;
  promoterId?: string;
  state?: string;
  city?: string;
  storeId?: string;
}

type RawDashboard={operations:Array<{id:string;name:string;startsAt:Date;endsAt:Date;status:string;updatedAt:Date;visits:Array<{status:string;storeId:string;promoterId:string}>}>;visits:Array<{id:string;status:string;scheduledDate:Date;updatedAt:Date;promoterId:string;storeId:string;industryId:string;operation:{name:string};store:{state:string|null;city:string|null};industry:{name:string}}> ;imports:Array<{id:string;status:string;createdAt:Date;files:Array<{fileName:string}>}>;audits:Array<{id:string;action:string;createdAt:Date}>;counts:{promoters:number;stores:number;industries:number;reconciliations:number;unresolved:number}};
const monthKey=(date:Date)=>`${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}`;
const aggregate=(values:string[])=>[...values.reduce((map,key)=>map.set(key,(map.get(key)||0)+1),new Map<string,number>())].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
export function buildDashboardOverview(raw:RawDashboard,now=new Date()){
  const planned=raw.visits.filter(v=>v.status==='PLANEJADA').length;const completed=raw.visits.filter(v=>v.status==='REALIZADA').length;const overdue=raw.visits.filter(v=>v.status==='PLANEJADA'&&v.scheduledDate<now).length;
  const months=Array.from({length:6},(_,i)=>{const d=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-5+i,1));return{key:monthKey(d),label:new Intl.DateTimeFormat('pt-BR',{month:'short',year:'2-digit',timeZone:'UTC'}).format(d),value:0}});const monthMap=new Map(months.map(x=>[x.key,x]));raw.imports.forEach(x=>{const item=monthMap.get(monthKey(x.createdAt));if(item)item.value++});
  const operations=raw.operations.map(op=>({id:op.id,name:op.name,startsAt:op.startsAt,endsAt:op.endsAt,status:op.status,updatedAt:op.updatedAt,stores:new Set(op.visits.map(v=>v.storeId)).size,promoters:new Set(op.visits.map(v=>v.promoterId)).size,visits:op.visits.length}));
  const activities=[...raw.imports.slice(0,8).map(x=>({id:`import-${x.id}`,type:'Importação',description:x.files[0]?.fileName||'Arquivo importado',date:x.createdAt})),...raw.operations.slice(0,8).map(x=>({id:`operation-${x.id}`,type:'Operação',description:x.name,date:x.updatedAt})),...raw.visits.slice(0,8).map(x=>({id:`visit-${x.id}`,type:'Visita',description:`${x.operation.name} · ${x.status}`,date:x.updatedAt})),...raw.audits.map(x=>({id:`audit-${x.id}`,type:'Conciliação',description:x.action,date:x.createdAt}))].sort((a,b)=>b.date.getTime()-a.date.getTime()).slice(0,10);
  return{cards:{operations:raw.operations.length,promoters:raw.counts.promoters,stores:raw.counts.stores,industries:raw.counts.industries,planned,completed,pending:overdue,divergences:raw.counts.unresolved,reconciliations:raw.counts.reconciliations,lastImport:raw.imports[0]||null},operations,charts:{byOperation:aggregate(raw.visits.map(v=>v.operation.name).filter(name=>name!=='MK9 - OPERAÇÃO PADRÃO')).slice(0,8),byState:aggregate(raw.visits.map(v=>v.store.state||'Não informado')).slice(0,8),byIndustry:aggregate(raw.visits.map(v=>v.industry.name)).slice(0,8),importsByMonth:months},activities};
}
export class DashboardOverviewService{
  static async getData(filters: DashboardFilters = {}) {
    const where: any = {};
    if (filters.startDate || filters.endDate) {
      where.scheduledDate = {};
      if (filters.startDate) where.scheduledDate.gte = new Date(filters.startDate);
      if (filters.endDate) where.scheduledDate.lte = new Date(filters.endDate);
    }
    if (filters.industryId) where.industryId = filters.industryId;
    if (filters.promoterId) where.promoterId = filters.promoterId;
    if (filters.storeId) where.storeId = filters.storeId;
    if (filters.state || filters.city) {
      where.store = {};
      if (filters.state) where.store.state = filters.state;
      if (filters.city) where.store.city = filters.city;
    }

    const evidenceWhere: any = {};
    if (filters.startDate || filters.endDate) {
      evidenceWhere.evidenceDate = {};
      if (filters.startDate) evidenceWhere.evidenceDate.gte = new Date(filters.startDate);
      if (filters.endDate) evidenceWhere.evidenceDate.lte = new Date(filters.endDate);
    }
    if (filters.industryId) evidenceWhere.industryId = filters.industryId;
    if (filters.promoterId) evidenceWhere.visit = { promoterId: filters.promoterId };
    if (filters.storeId) evidenceWhere.storeId = filters.storeId;
    if (filters.state || filters.city) {
      evidenceWhere.OR = [
        { store: { state: filters.state || undefined, city: filters.city || undefined } },
        { rawState: filters.state || undefined, rawCity: filters.city || undefined }
      ].filter(x => x.store?.state !== undefined || x.store?.city !== undefined || x.rawState !== undefined || x.rawCity !== undefined);
      if (evidenceWhere.OR.length === 0) delete evidenceWhere.OR;
    }

    const[operations,visits,imports,audits,promoters,stores,industries,reconciliations,unresolved,allIndustries,allPromoters,allStores]=await Promise.all([
      prisma.operation.findMany({where:{name:{not:'MK9 - OPERAÇÃO PADRÃO'}},orderBy:{updatedAt:'desc'},include:{visits:{select:{status:true,storeId:true,promoterId:true}}}}),
      prisma.visit.findMany({where,orderBy:{updatedAt:'desc'},include:{operation:{select:{name:true}},store:{select:{state:true,city:true}},industry:{select:{name:true}}}}),
      prisma.import.findMany({orderBy:{createdAt:'desc'},include:{files:{select:{fileName:true}}}}),
      prisma.reconciliationAudit.findMany({orderBy:{createdAt:'desc'},take:10}),
      prisma.promoter.count({where:{deletedAt:null}}),
      prisma.store.count({where:{archivedAt:null}}),
      prisma.industry.count({where:{archivedAt:null}}),
      prisma.visitEvidence.count({where:evidenceWhere}),
      prisma.visitEvidence.count({where:{...evidenceWhere,result:{in:['AMBIGUOUS','DATE_MISMATCH','STORE_NOT_FOUND','INDUSTRY_NOT_FOUND']}}}),
      prisma.industry.findMany({where:{archivedAt:null},orderBy:{name:'asc'},select:{id:true,name:true}}),
      prisma.promoter.findMany({where:{deletedAt:null},orderBy:{name:'asc'},select:{id:true,name:true}}),
      prisma.store.findMany({where:{archivedAt:null},orderBy:{name:'asc'},select:{id:true,name:true,state:true,city:true}})
    ]);

    const overview = buildDashboardOverview({operations,visits,imports,audits,counts:{promoters,stores,industries,reconciliations,unresolved}});
    
    // Replace counts of active promoters, stores, and industries based on filtered visits if filtered
    const activePromoterCount = new Set(visits.map(v => v.promoterId)).size;
    const activeStoreCount = new Set(visits.map(v => v.storeId)).size;
    const activeIndustryCount = new Set(visits.map(v => v.industryId)).size;

    overview.cards.promoters = activePromoterCount || promoters;
    overview.cards.stores = activeStoreCount || stores;
    overview.cards.industries = activeIndustryCount || industries;

    return {
      ...overview,
      options: {
        industries: allIndustries,
        promoters: allPromoters,
        stores: allStores,
        states: [...new Set(allStores.map(s => s.state).filter(Boolean))].sort(),
        cities: [...new Set(allStores.map(s => s.city).filter(Boolean))].sort(),
      }
    };
  }
}