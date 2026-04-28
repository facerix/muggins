import assert from 'node:assert/strict';
import test from 'node:test';

import { rankLabel } from '/src/views/cardSvg.js';

test('rankLabel maps ace and court', () => {
  assert.equal(rankLabel(1), 'A');
  assert.equal(rankLabel(11), 'J');
  assert.equal(rankLabel(12), 'Q');
  assert.equal(rankLabel(13), 'K');
});

test('rankLabel uses decimal numerals for 2–10', () => {
  assert.equal(rankLabel(2), '2');
  assert.equal(rankLabel(10), '10');
});
