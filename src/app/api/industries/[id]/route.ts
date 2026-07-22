import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { industryService } from '@/modules/industries/services/IndustryService';
const fail=(error:unknown)=>{const value=error as Error&{status?:number};return NextResponse.json({error:value.message||'Não foi possível processar a indústria.'},{status:value.status||400})};
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){try{return NextResponse.json(await industryService.getIndustryById((await params).id))}catch(error){return fail(error)}}
export async function PUT(request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const result=await industryService.updateIndustry(id,await request.json());revalidatePath('/dashboard/industrias');revalidatePath(`/dashboard/industrias/${id}`);return NextResponse.json(result)}catch(error){return fail(error)}}
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;const body=await request.json() as {action?:string};if(!['archive','restore'].includes(body.action||''))return NextResponse.json({error:'Ação inválida.'},{status:400});const result=await industryService.setArchived(id,body.action==='archive');revalidatePath('/dashboard/industrias');revalidatePath(`/dashboard/industrias/${id}`);return NextResponse.json(result)}catch(error){return fail(error)}}
export const dynamic='force-dynamic';
