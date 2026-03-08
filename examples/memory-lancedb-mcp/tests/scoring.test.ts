import { describe, it, expect } from 'vitest';
import { applyScoring } from '../src/scoring.js';
import type { MemoryEntry } from '../src/types.js';

function makeEntry(overrides: Partial<MemoryEntry> = {}): MemoryEntry {
  return {
    id: 'test-id',
    content: 'テスト',
    category: 'fact',
    scope: 'global',
    tags: [],
    importance: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'test',
    vector: [],
    ...overrides,
  };
}

describe('scoring', () => {
  it('ベクトルスコアが高いほど総合スコアが高い', () => {
    const entry = makeEntry();
    const scoreHigh = applyScoring(0.9, entry);
    const scoreLow = applyScoring(0.3, entry);
    expect(scoreHigh).toBeGreaterThan(scoreLow);
  });

  it('重要度が高いほどスコアが上がる', () => {
    const highImp = makeEntry({ importance: 10 });
    const lowImp = makeEntry({ importance: 1 });
    const scoreHigh = applyScoring(0.7, highImp);
    const scoreLow = applyScoring(0.7, lowImp);
    expect(scoreHigh).toBeGreaterThan(scoreLow);
  });

  it('古い記憶は時間減衰でスコアが下がる', () => {
    const recent = makeEntry({ createdAt: new Date().toISOString() });
    const old = makeEntry({
      createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const scoreRecent = applyScoring(0.7, recent);
    const scoreOld = applyScoring(0.7, old);
    expect(scoreRecent).toBeGreaterThan(scoreOld);
  });

  it('スコアは0-1の範囲に収まる', () => {
    const entry = makeEntry({ importance: 10 });
    const score = applyScoring(1.0, entry);
    expect(score).toBeLessThanOrEqual(1.0);
    expect(score).toBeGreaterThan(0);
  });
});
