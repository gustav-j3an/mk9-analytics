import assert from 'node:assert/strict';
import test from 'node:test';
import { StoreAliasResolver } from './StoreAliasResolver';
import { IndustryAliasResolver } from './IndustryAliasResolver';

test('resolve nome alternativo de loja somente com candidato unico', () => {
  const result = StoreAliasResolver.resolve('ASSAI - HUNTERS', [{
    id: 's1', code: 'ASSAI HUNTERS', name: 'ASSAÍ HUNTERS', state: 'SP',
  }], 'SP');
  assert.equal(result?.id, 's1');
});

test('resolve alias de industria', () => {
  const result = IndustryAliasResolver.resolve('KING ALIMENTOS', [{
    id: 'i1', code: 'KING', name: 'KING', aliases: ['KING ALIMENTOS'],
  }]);
  assert.equal(result?.id, 'i1');
});

test('nao associa automaticamente nome ambiguo', () => {
  const result = StoreAliasResolver.resolve('LOJA A', [
    { id: 's1', code: 'LOJA A', name: 'LOJA A' },
    { id: 's2', code: 'LOJA A 2', name: 'LOJA A' },
  ]);
  assert.equal(result?.ambiguous, true);
});

test('normaliza acento, hifen e UF no fim do nome', () => {
  const result = StoreAliasResolver.resolve('DIA A DIA AGUAS CLARAS DF', [{
    id: 's1', code: 'DIA A DIA AGUAS CLARAS', name: 'DIA A DIA - ÁGUAS CLARAS', state: 'DF',
  }], 'DF');
  assert.equal(result?.id, 's1');
});

test('nao cruza a mesma loja entre UFs diferentes', () => {
  const result = StoreAliasResolver.resolve('ASSAI CENTRO', [
    { id: 'df', code: 'ASSAI CENTRO DF', name: 'ASSAI CENTRO', state: 'DF' },
    { id: 'go', code: 'ASSAI CENTRO GO', name: 'ASSAI CENTRO', state: 'GO' },
  ], 'GO');
  assert.equal(result?.id, 'go');
});

test('abreviacao de bandeira incompatível nao recebe pontuacao', () => {
  const result = StoreAliasResolver.resolve('DIA A DIA CENTRO', [{
    id: 's1', code: 'ASSAI CENTRO', name: 'ASSAI CENTRO', state: 'DF',
  }], 'DF');
  assert.equal(result, null);
});
