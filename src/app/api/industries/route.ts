import { NextResponse } from 'next/server';
import { industryService } from '@/modules/industries/services/IndustryService';
const fail=(error:unknown)=>{const value=error as Error&{status?:number};return NextResponse.json({error:value.message||'Não foi possível processar a indústria.'},{status:value.status||400})};
export async function GET(request:Request){try{const q=new URL(request.url).searchParams;return NextResponse.json(await industryService.getIndustries({page:Number(q.get('page'))||1,limit:Number(q.get('limit'))||15,search:q.get('search')||undefined,archived:(q.get('archived')||'active') as 'active'|'archived'|'all'}))}catch(error){return fail(error)}}
export async function POST(request:Request){try{return NextResponse.json(await industryService.createIndustry(await request.json()),{status:201})}catch(error){return fail(error)}}
export const dynamic='force-dynamic';
