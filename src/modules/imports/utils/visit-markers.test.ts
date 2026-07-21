import assert from 'node:assert/strict';
import test from 'node:test';
import { isVisitMarked } from './visit-markers';

test('reconhece valores booleanos', () => {
  assert.equal(isVisitMarked(true), true);
  assert.equal(isVisitMarked(false), false);
});

test('reconhece números 1 e 0', () => {
  assert.equal(isVisitMarked(1), true);
  assert.equal(isVisitMarked(0), false);
});

test('reconhece todos os textos e símbolos aceitos', () => {
  for (const value of ['TRUE', '1', 'X', 'x', 'SIM', 'S', 'OK', '✓', '✔', '☑', '✅']) {
    assert.equal(isVisitMarked(value), true, `deveria reconhecer ${value}`);
  }
});

test('remove espaços comuns e invisíveis', () => {
  assert.equal(isVisitMarked('\u200B\u00A0 x \uFEFF'), true);
});

test('não marca células vazias nem valores negativos explícitos', () => {
  for (const value of ['', null, undefined, '-', 'FALSE', '0', 'NÃO', 'NAO']) {
    assert.equal(isVisitMarked(value), false, `não deveria reconhecer ${String(value)}`);
  }
});

test('reconhece o valor formatado quando ele é passado para a função central', () => {
  const formattedValue = '✅';
  assert.equal(isVisitMarked(formattedValue), true);
});
