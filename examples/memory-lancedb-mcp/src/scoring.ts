import type { MemoryEntry } from './types.js';

const TIME_DECAY_HALF_LIFE_DAYS = 30;
const IMPORTANCE_WEIGHT = 0.15;
const RECENCY_WEIGHT = 0.2;
const VECTOR_WEIGHT = 0.65;

/** 時間減衰を計算（指数関数的） */
function timeDecay(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, ageDays / TIME_DECAY_HALF_LIFE_DAYS);
}

/** 重要度をスコアに変換（1-10 → 0.1-1.0） */
function importanceScore(importance: number): number {
  return Math.max(0.1, Math.min(1.0, importance / 10));
}

/** 総合スコアリング */
export function applyScoring(vectorScore: number, entry: MemoryEntry): number {
  const recency = timeDecay(entry.createdAt);
  const importance = importanceScore(entry.importance);

  const score =
    VECTOR_WEIGHT * vectorScore +
    RECENCY_WEIGHT * recency +
    IMPORTANCE_WEIGHT * importance;

  return Math.round(score * 1000) / 1000;
}
