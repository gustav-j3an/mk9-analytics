import assert from 'node:assert/strict';
import test from 'node:test';
import { prisma } from '@/lib/prisma';
import { industryService } from './services/IndustryService';
import { validateIndustryData, validateIndustryUpdateData } from './validators/industry.validator';

test('valida indústria com frequência contratada',()=>{const value=validateIndustryData({code:'IND-1',name:'Indústria Teste',contractedFrequency:'4'});assert.equal(value.contractedFrequency,4)});
test('edição parcial não exige código e nome',()=>{assert.deepEqual(validateIndustryUpdateData({contractedFrequency:8}),{contractedFrequency:8})});
test('rejeita frequência negativa',()=>{assert.throws(()=>validateIndustryData({code:'I',name:'Indústria',contractedFrequency:-1}))});
test('arquiva e restaura sem excluir a indústria',async()=>{const delegate=prisma.industry;const find=delegate.findUnique;const update=delegate.update;Reflect.set(delegate,'findUnique',async()=>({id:'industry-1'}));Reflect.set(delegate,'update',async(args:{data:{archivedAt:Date|null}})=>({id:'industry-1',...args.data}));try{const archived=await industryService.setArchived('industry-1',true);const restored=await industryService.setArchived('industry-1',false);assert.ok(archived.archivedAt instanceof Date);assert.equal(restored.archivedAt,null)}finally{Reflect.set(delegate,'findUnique',find);Reflect.set(delegate,'update',update)}});