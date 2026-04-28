import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeRng } from '../../src/engine/rng.js';

test('makeRng with the same seed produces the same sequence', () => {
  const a = makeRng(42);
  const b = makeRng(42);
  for (let i = 0; i < 1000; i++) {
    assert.equal(a.next(), b.next());
  }
});

test('makeRng with different seeds produces different sequences', () => {
  const a = makeRng(1);
  const b = makeRng(2);
  let differs = false;
  for (let i = 0; i < 100 && !differs; i++) {
    if (a.next() !== b.next()) differs = true;
  }
  assert.ok(differs, 'expected at least one differing value within 100 draws');
});

test('makeRng.next() returns values in [0, 1)', () => {
  const r = makeRng(1234);
  for (let i = 0; i < 10000; i++) {
    const v = r.next();
    assert.ok(v >= 0 && v < 1, `value out of range: ${v}`);
  }
});

test('makeRng.state advances with each call to next()', () => {
  const r = makeRng(42);
  const s0 = r.state;
  r.next();
  const s1 = r.state;
  r.next();
  const s2 = r.state;
  assert.notEqual(s0, s1);
  assert.notEqual(s1, s2);
});

test('makeRng can resume from a saved state and produce identical output', () => {
  const r1 = makeRng(42);
  for (let i = 0; i < 5; i++) r1.next();
  const checkpoint = r1.state;
  const expected = [r1.next(), r1.next(), r1.next()];

  const r2 = makeRng(checkpoint);
  const actual = [r2.next(), r2.next(), r2.next()];

  assert.deepEqual(actual, expected);
});

test('makeRng.range(max) returns an integer in [0, max)', () => {
  const r = makeRng(99);
  for (let i = 0; i < 10000; i++) {
    const v = r.range(13);
    assert.ok(Number.isInteger(v), `not an integer: ${v}`);
    assert.ok(v >= 0 && v < 13, `out of range: ${v}`);
  }
});

test('makeRng.range with same seed produces same integer sequence', () => {
  const a = makeRng(7);
  const b = makeRng(7);
  for (let i = 0; i < 1000; i++) {
    assert.equal(a.range(100), b.range(100));
  }
});

test('makeRng coerces non-integer / negative seeds to a uint32 deterministically', () => {
  // Mulberry32 normalizes via `>>> 0`. Same effective seed → same sequence.
  const a = makeRng(-1);
  const b = makeRng(0xffffffff);
  for (let i = 0; i < 100; i++) {
    assert.equal(a.next(), b.next());
  }
});
