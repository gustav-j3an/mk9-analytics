import assert from'node:assert/strict';import test from'node:test';import{prisma}from'@/lib/prisma';import{promoterService}from'./services/PromoterService';import{validatePromoterData,validatePromoterUpdateData}from'./validators/promoter.validator';
const supervisorId='cm12345678901234567890123';
test('valida campos do promotor e normaliza UF',()=>{const result=validatePromoterData({name:'João',phone:'61999999999',email:'joao@example.com',city:'Brasília',state:'df',status:'ACTIVE',supervisorId});assert.equal(result.state,'DF');assert.equal(result.email,'joao@example.com')});
test('edição parcial não exige nome ou supervisor',()=>assert.deepEqual(validatePromoterUpdateData({status:'INACTIVE'}),{status:'INACTIVE'}));
test('rejeita email e UF inválidos',()=>{assert.throws(()=>validatePromoterData({name:'João',email:'x',state:'Distrito Federal',supervisorId}))});
test('arquiva, exclui logicamente e restaura sem remover visitas',async()=>{const d=prisma.promoter;const find=d.findUnique;const update=d.update;const changes:unknown[]=[];Reflect.set(d,'findUnique',async()=>({id:'p1'}));Reflect.set(d,'update',async(args:{data:Record<string,unknown>})=>{changes.push(args.data);return{id:'p1',...args.data}});try{const archived=await promoterService.setState('p1','archive');const deleted=await promoterService.setState('p1','delete');const restored=await promoterService.setState('p1','restore');assert.ok(archived.archivedAt instanceof Date);assert.ok(deleted.deletedAt instanceof Date);assert.equal(restored.deletedAt,null);assert.equal(changes.length,3)}finally{Reflect.set(d,'findUnique',find);Reflect.set(d,'update',update)}});
test('duplica cadastro sem duplicar visitas',async()=>{const d=prisma.promoter;const find=d.findUnique;const create=d.create;let payload:Record<string,unknown>|undefined;Reflect.set(d,'findUnique',async()=>({id:'p1',name:'Ana',phone:null,email:null,city:'Goiânia',state:'GO',supervisorId,operationId:null}));Reflect.set(d,'create',async(args:{data:Record<string,unknown>})=>{payload=args.data;return{id:'p2',...args.data}});try{const copy=await promoterService.duplicate('p1');assert.equal(copy.name,'Ana (cópia)');assert.equal('visits'in(payload||{}),false)}finally{Reflect.set(d,'findUnique',find);Reflect.set(d,'create',create)}});

test('rejeita cadastro de promotor duplicado por nome, telefone ou e-mail', async () => {
  const d = prisma.promoter;
  const originalFindFirst = d.findFirst;
  
  Reflect.set(d, 'findFirst', async () => {
    return { id: 'existing-p-1', name: 'João' };
  });

  try {
    await assert.rejects(
      promoterService.createPromoter({
        name: 'João',
        phone: '61999999999',
        email: 'joao@example.com',
        supervisorId,
        status: 'ACTIVE'
      }),
      /já cadastrado/
    );
  } finally {
    Reflect.set(d, 'findFirst', originalFindFirst);
  }
});