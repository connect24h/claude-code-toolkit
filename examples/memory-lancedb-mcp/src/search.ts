import type { MemoryStore } from './memory-store.js';
import type { SearchResult, RecallRequest } from './types.js';
import { applyScoring } from './scoring.js';

/** ハイブリッド検索（ベクトル検索 + スコアリング） */
export async function hybridSearch(
  store: MemoryStore,
  request: RecallRequest,
): Promise<SearchResult[]> {
  const limit = request.limit ?? 10;
  const minScore = request.minScore ?? 0.3;

  // ベクトル検索（多めに取得してスコアリングで絞る）
  const vectorResults = await store.vectorSearch(request.query, limit * 3);

  // スコープ・カテゴリフィルタ
  let filtered = vectorResults;
  if (request.scope) {
    filtered = filtered.filter((r) => r.entry.scope === request.scope);
  }
  if (request.category) {
    filtered = filtered.filter((r) => r.entry.category === request.category);
  }

  // スコアリングパイプライン適用
  const scored: SearchResult[] = filtered.map((r) => ({
    entry: r.entry,
    score: applyScoring(r.score, r.entry),
    matchType: 'vector' as const,
  }));

  // 最小スコアフィルタ + ソート + リミット
  return scored
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
