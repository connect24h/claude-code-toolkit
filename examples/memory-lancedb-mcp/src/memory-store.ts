import * as lancedb from '@lancedb/lancedb';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import type {
  EmbeddingProvider,
  MemoryEntry,
  StoreRequest,
  ListFilter,
  MemoryStats,
  MemoryScope,
  MemoryCategory,
} from './types.js';

const TABLE_NAME = 'memories';
const CATEGORIES: MemoryCategory[] = ['preference', 'fact', 'decision', 'entity', 'learning', 'other'];
const SCOPES: MemoryScope[] = ['global', 'project', 'agent'];

export class MemoryStore {
  private db: lancedb.Connection | null = null;
  private table: lancedb.Table | null = null;

  constructor(
    private readonly dbPath: string,
    private readonly embedding: EmbeddingProvider,
    private readonly defaultScope: MemoryScope = 'global',
  ) {}

  /** DB接続 + テーブル初期化 */
  async init(): Promise<void> {
    await mkdir(this.dbPath, { recursive: true });
    this.db = await lancedb.connect(this.dbPath);

    const tableNames = await this.db.tableNames();
    if (tableNames.includes(TABLE_NAME)) {
      this.table = await this.db.openTable(TABLE_NAME);
    }
  }

  /** テーブルがなければ初期データで作成 */
  private async ensureTable(vector: number[]): Promise<lancedb.Table> {
    if (this.table) return this.table;
    if (!this.db) throw new Error('DBが初期化されていません');

    // 空のテーブルを初期データで作成
    const now = new Date().toISOString();
    const initEntry = {
      id: randomUUID(),
      content: '__init__',
      category: 'other',
      scope: 'global',
      tags: '[]',
      importance: 0,
      createdAt: now,
      updatedAt: now,
      source: 'system',
      vector,
    };

    this.table = await this.db.createTable(TABLE_NAME, [initEntry]);
    return this.table;
  }

  /** 記憶を保存 */
  async store(request: StoreRequest): Promise<MemoryEntry> {
    const now = new Date().toISOString();
    const vector = await this.embedding.embed(request.content);

    const table = await this.ensureTable(vector);

    const entry: MemoryEntry = {
      id: randomUUID(),
      content: request.content,
      category: request.category ?? 'other',
      scope: request.scope ?? this.defaultScope,
      tags: request.tags ?? [],
      importance: request.importance ?? 5,
      createdAt: now,
      updatedAt: now,
      source: request.source ?? 'user',
      vector,
    };

    // LanceDBはtagsを文字列として保存
    await table.add([{
      ...entry,
      tags: JSON.stringify(entry.tags),
    }]);

    return entry;
  }

  /** ベクトル検索 */
  async vectorSearch(query: string, limit: number = 10): Promise<Array<{ entry: MemoryEntry; score: number }>> {
    if (!this.table) return [];

    const queryVector = await this.embedding.embed(query);

    const results = await this.table
      .vectorSearch(queryVector)
      .limit(limit)
      .toArray();

    return results
      .filter((r) => r.content !== '__init__')
      .map((r) => ({
        entry: {
          id: r.id as string,
          content: r.content as string,
          category: r.category as MemoryCategory,
          scope: r.scope as MemoryScope,
          tags: typeof r.tags === 'string' ? JSON.parse(r.tags as string) as string[] : r.tags as string[],
          importance: r.importance as number,
          createdAt: r.createdAt as string,
          updatedAt: r.updatedAt as string,
          source: r.source as string,
          vector: r.vector as number[],
        },
        score: 1 - (r._distance as number ?? 0),
      }));
  }

  /** 全件取得（フィルタ付き） */
  async list(filter?: ListFilter): Promise<MemoryEntry[]> {
    if (!this.table) return [];

    const limit = filter?.limit ?? 50;
    const offset = filter?.offset ?? 0;

    let results = await this.table.query().limit(limit + offset).toArray();

    // フィルタリング
    results = results.filter((r) => r.content !== '__init__');

    if (filter?.scope) {
      results = results.filter((r) => r.scope === filter.scope);
    }
    if (filter?.category) {
      results = results.filter((r) => r.category === filter.category);
    }
    if (filter?.tag) {
      results = results.filter((r) => {
        const tags = typeof r.tags === 'string' ? JSON.parse(r.tags as string) as string[] : r.tags as string[];
        return tags.includes(filter.tag!);
      });
    }

    return results.slice(offset, offset + limit).map((r) => ({
      id: r.id as string,
      content: r.content as string,
      category: r.category as MemoryCategory,
      scope: r.scope as MemoryScope,
      tags: typeof r.tags === 'string' ? JSON.parse(r.tags as string) as string[] : r.tags as string[],
      importance: r.importance as number,
      createdAt: r.createdAt as string,
      updatedAt: r.updatedAt as string,
      source: r.source as string,
      vector: r.vector as number[],
    }));
  }

  /** IDで削除 */
  async forget(id: string): Promise<boolean> {
    if (!this.table) return false;
    await this.table.delete(`id = '${id}'`);
    return true;
  }

  /** 統計情報 */
  async stats(): Promise<MemoryStats> {
    const entries = await this.list({ limit: 10000 });

    const byCategory = Object.fromEntries(
      CATEGORIES.map((c) => [c, entries.filter((e) => e.category === c).length]),
    ) as Record<MemoryCategory, number>;

    const byScope = Object.fromEntries(
      SCOPES.map((s) => [s, entries.filter((e) => e.scope === s).length]),
    ) as Record<MemoryScope, number>;

    return {
      totalEntries: entries.length,
      byCategory,
      byScope,
      dbSizeBytes: 0,
      embeddingProvider: this.embedding.name,
      embeddingDimension: this.embedding.dimension,
    };
  }

  /** 全エントリをエクスポート */
  async exportAll(): Promise<MemoryEntry[]> {
    return this.list({ limit: 100000 });
  }

  /** バルクインポート */
  async importEntries(entries: StoreRequest[]): Promise<number> {
    let count = 0;
    for (const entry of entries) {
      await this.store(entry);
      count++;
    }
    return count;
  }
}
