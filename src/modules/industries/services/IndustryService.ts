import { prisma } from '@/lib/prisma';
import { validateIndustryData, validateIndustryUpdateData } from '../validators/industry.validator';

function input(data:Record<string,unknown>){return {...data,contractedFrequency:data.contractedFrequency===''||data.contractedFrequency===undefined?null:data.contractedFrequency}}
function missing(){const error=new Error('Indústria não encontrada.');(error as Error&{status?:number}).status=404;return error}
export const industryService={
 async getIndustries(options:{page?:number;limit?:number;search?:string;archived?:'active'|'archived'|'all'}={}){const page=Math.max(1,options.page??1);const limit=Math.min(100,Math.max(1,options.limit??15));const where:Record<string,unknown>=options.archived==='all'?{}:{archivedAt:options.archived==='archived'?{not:null}:null};if(options.search)where.name={contains:options.search,mode:'insensitive'};const [items,total]=await Promise.all([prisma.industry.findMany({where,skip:(page-1)*limit,take:limit,orderBy:{name:'asc'},include:{_count:{select:{visits:true,evidences:true}}}}),prisma.industry.count({where})]);return {items,pagination:{page,limit,total,pages:Math.ceil(total/limit)}}},
 async getIndustryById(id:string){const industry=await prisma.industry.findUnique({where:{id},include:{visits:{orderBy:{scheduledDate:'desc'},include:{store:true,promoter:true,operation:true}},evidences:{orderBy:{evidenceDate:'desc'},include:{operation:true,store:true}}}});if(!industry)throw missing();return industry},
 async createIndustry(data:Record<string,unknown>){return prisma.industry.create({data:validateIndustryData(input(data))})},
 async updateIndustry(id:string,data:Record<string,unknown>){if(!await prisma.industry.findUnique({where:{id},select:{id:true}}))throw missing();return prisma.industry.update({where:{id},data:validateIndustryUpdateData(input(data))})},
 async setArchived(id:string,archived:boolean){if(!await prisma.industry.findUnique({where:{id},select:{id:true}}))throw missing();return prisma.industry.update({where:{id},data:{archivedAt:archived?new Date():null}})},
};
