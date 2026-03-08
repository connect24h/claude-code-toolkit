/** Embeddingプロバイダー種別 */
export type EmbeddingProviderType = 'openai' | 'gemini' | 'voyage' | 'ollama' | 'codex-ollama' | 'gemini-ollama' | 'claude-ollama';

/** 記憶カテゴリ */
export type MemoryCategory = 'preference' | 'fact' | 'decision' | 'entity' | 'learning' | 'other';

/** 記憶スコープ */
export type MemoryScope = 'global' | 'project' | 'agent';

/** Embeddingプロバイダーインターフェース */
export interface EmbeddingProvider {
  readonly name: EmbeddingProviderType;
  readonly dimension: number;
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

/** Embeddingプロバイダー設定 */
export interface EmbeddingConfig {
  provider: EmbeddingProviderType;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

/** MCPサーバー設定 */
export interface ServerConfig {
  embedding: EmbeddingConfig;
  dbPath: string;
  markdownPath: string;
  defaultScope: MemoryScope;
}

/** LanceDBに保存する記憶エントリ */
export interface MemoryEntry {
  id: string;
  content: string;
  category: MemoryCategory;
  scope: MemoryScope;
  tags: string[];
  importance: number;
  createdAt: string;
  updatedAt: string;
  source: string;
  vector: number[];
}

/** 検索結果 */
export interface SearchResult {
  entry: MemoryEntry;
  score: number;
  matchType: 'vector' | 'fts' | 'hybrid';
}

/** 記憶保存リクエスト */
export interface StoreRequest {
  content: string;
  category?: MemoryCategory;
  scope?: MemoryScope;
  tags?: string[];
  importance?: number;
  source?: string;
}

/** 検索リクエスト */
export interface RecallRequest {
  query: string;
  scope?: MemoryScope;
  category?: MemoryCategory;
  limit?: number;
  minScore?: number;
}

/** 記憶統計 */
export interface MemoryStats {
  totalEntries: number;
  byCategory: Record<MemoryCategory, number>;
  byScope: Record<MemoryScope, number>;
  dbSizeBytes: number;
  embeddingProvider: string;
  embeddingDimension: number;
}

/** フィルタ条件 */
export interface ListFilter {
  scope?: MemoryScope;
  category?: MemoryCategory;
  tag?: string;
  limit?: number;
  offset?: number;
}
