import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeManualVisitFields } from './RoutesDashboardService';
test('registros antigos aceitam campos manuais nulos', () => { assert.deepEqual(normalizeManualVisitFields({ routeOrder: null, weeklyFrequency: null, plannedTime: null, estimatedDurationMinutes: null, notes: null }), { routeOrder: null, weeklyFrequency: 1, plannedTime: null, estimatedDurationMinutes: null, notes: null }); });
test('visita sem campos manuais recebe defaults compatíveis', () => { assert.deepEqual(normalizeManualVisitFields({}), { routeOrder: null, weeklyFrequency: 1, plannedTime: null, estimatedDurationMinutes: null, notes: null }); });