import assert from 'node:assert/strict';
import test from 'node:test';
import { isRouteSchemaMismatch, prismaErrorCode, ROUTE_SCHEMA_MESSAGE } from './RouteDatabaseError';
test('reconhece P2022 como incompatibilidade conhecida de schema', () => { assert.equal(isRouteSchemaMismatch({ code: 'P2022', message: 'column does not exist' }), true); assert.equal(prismaErrorCode({ code: 'P2022' }), 'P2022'); assert.match(ROUTE_SCHEMA_MESSAGE, /atualização necessária/); });
test('não classifica falhas não relacionadas como incompatibilidade de schema', () => { assert.equal(isRouteSchemaMismatch({ code: 'P2002' }), false); assert.equal(isRouteSchemaMismatch(new Error('network failure')), false); });