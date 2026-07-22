import test from 'node:test';
import assert from 'node:assert/strict';
import { canSearch, normalizeSearchQuery, SEARCH_MIN_LENGTH } from './global-search';

test('global search trims and limits user input', () => {
  assert.equal(normalizeSearchQuery('  Loja Central  '), 'Loja Central');
  assert.equal(normalizeSearchQuery('x'.repeat(120)).length, 80);
});

test('global search requires a meaningful query', () => {
  assert.equal(SEARCH_MIN_LENGTH, 2);
  assert.equal(canSearch(' A '), false);
  assert.equal(canSearch(' DF '), true);
});