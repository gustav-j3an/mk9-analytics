import { prisma } from '@/lib/prisma';
import { validatePromoterData,validatePromoterUpdateData } from '../validators/promoter.validator';
const optional=(data:Record<string,unknown>)=>Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v===''?null:v]));
const missing=()=>{const e=new Error('Promotor não encontrado.');(e as Error&{status?:number}).status=404;return e};
export const promoterService={
 async getPromoters(options:{search?:string;state?:string;supervisorId?:string;operationId?:string;visibility?:'active'|'archived'|'deleted'|'all'}={}){const where:Record<string,unknown>=options.visibility==='all'?{}:options.visibility==='archived'?{archivedAt:{not:null},deletedAt:null}:options.visibility==='deleted'?{deletedAt:{not:null}}:{archivedAt:null,deletedAt:null};if(options.search)where.name={contains:options.search,mode:'insensitive'};if(options.state)where.state=options.state;if(options.supervisorId)where.supervisorId=options.supervisorId;if(options.operationId)where.OR=[{operationId:options.operationId},{visits:{some:{operationId:options.operationId}}}];return prisma.promoter.findMany({where,include:{supervisor:true,operation:true,_count:{select:{visits:true}}},orderBy:{name:'asc'}})},
 async getOptions(){const [supervisors,operations]=await Promise.all([prisma.supervisor.findMany({select:{id:true,name:true},orderBy:{name:'asc'}}),prisma.operation.findMany({select:{id:true,name:true},orderBy:{startsAt:'desc'}})]);return {supervisors,operations}},
 async getPromoterById(id:string){const item=await prisma.promoter.findUnique({where:{id},include:{supervisor:true,operation:true,visits:{orderBy:{scheduledDate:'desc'},include:{store:true,industry:true,operation:true}}}});if(!item)throw missing();return item},
  async createPromoter(data:Record<string,unknown>){
    const validated = validatePromoterData(optional(data));
    const duplicate = await prisma.promoter.findFirst({
      where: {
        OR: [
          { name: { equals: validated.name, mode: 'insensitive' } },
          validated.phone ? { phone: validated.phone } : undefined,
          validated.email ? { email: validated.email } : undefined,
        ].filter((x): x is any => x !== undefined),
        deletedAt: null
      }
    });
    if (duplicate) {
      const err = new Error('Promotor já cadastrado com este nome, telefone ou e-mail.');
      (err as any).status = 409;
      throw err;
    }
    if (!validated.operationId) {
      const { getOrCreateDefaultOperationId } = require('@/lib/prisma');
      validated.operationId = await getOrCreateDefaultOperationId();
    }
    return prisma.promoter.create({data:validated})
  },
 async updatePromoter(id:string,data:Record<string,unknown>){if(!await prisma.promoter.findUnique({where:{id},select:{id:true}}))throw missing();return prisma.promoter.update({where:{id},data:validatePromoterUpdateData(optional(data))})},
 async setState(id:string,action:'archive'|'restore'|'delete'){if(!await prisma.promoter.findUnique({where:{id},select:{id:true}}))throw missing();const data=action==='archive'?{archivedAt:new Date(),status:'INACTIVE' as const}:action==='delete'?{deletedAt:new Date(),status:'INACTIVE' as const}:{archivedAt:null,deletedAt:null,status:'ACTIVE' as const};return prisma.promoter.update({where:{id},data})},
 async duplicate(id:string){const source=await prisma.promoter.findUnique({where:{id}});if(!source)throw missing();return prisma.promoter.create({data:{name:`${source.name} (cópia)`,phone:source.phone,email:source.email,city:source.city,state:source.state,status:'ACTIVE',supervisorId:source.supervisorId,operationId:source.operationId}})},
};
