import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { MemoryStore } from '../src/memory-store.js';
import type { EmbeddingProvider } from '../src/types.js';

const TMP_DB = join(import.meta.dirname, '../.tmp-test-db');

/** テスト用のモックEmbeddingプロバイダー */
class MockEmbedding implements EmbeddingProvider {
  readonly name = 'ollama' as const;
  readonly dimension = 4;

  async embed(text: string): Promise<number[]> {
    // テキストの文字コードから決定論的なベクトルを生成
    const hash = Array.from(text).reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return [
      Math.sin(hash) * 0.5 + 0.5,
      Math.cos(hash) * 0.5 + 0.5,
      Math.sin(hash * 2) * 0.5 + 0.5,
      Math.cos(hash * 2) * 0.5 + 0.5,
    ];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((t) => this.embed(t)));
  }
}

describe('MemoryStore', () => {
  let store: MemoryStore;

  beforeEach(async () => {
    await rm(TMP_DB, { recursive: true, force: true });
    store = new MemoryStore(TMP_DB, new MockEmbedding());
    await store.init();
  });

  afterEach(async () => {
    await rm(TMP_DB, { recursive: true, force: true });
  });

  it('記憶を保存できる', async () => {
    const entry = await store.store({
      content: 'テストの記憶です',
      category: 'fact',
      tags: ['test'],
      importance: 7,
    });

    expect(entry.id).toBeDefined();
    expect(entry.content).toBe('テストの記憶です');
    expect(entry.category).toBe('fact');
    expect(entry.tags).toEqual(['test']);
    expect(entry.importance).toBe(7);
    expect(entry.vector).toHaveLength(4);
  });

  it('ベクトル検索できる', async () => {
    await store.store({ content: 'Playwrightでブラウザテストを行う', category: 'fact' });
    await store.store({ content: 'Vitestでユニットテストを書く', category: 'fact' });
    await store.store({ content: '今日の天気は晴れです', category: 'other' });

    const results = await store.vectorSearch('テスト', 10);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].score).toBeGreaterThan(0);
  });

  it('記憶一覧を取得できる', async () => {
    await store.store({ content: '記憶1', category: 'fact' });
    await store.store({ content: '記憶2', category: 'decision' });
    await store.store({ content: '記憶3', category: 'fact' });

    const all = await store.list();
    expect(all.length).toBe(3);

    const facts = await store.list({ category: 'fact' });
    expect(facts.length).toBe(2);
  });

  it('記憶を削除できる', async () => {
    const entry = await store.store({ content: '削除される記憶', category: 'other' });
    const before = await store.list();
    expect(before.length).toBe(1);

    await store.forget(entry.id);
    const after = await store.list();
    expect(after.length).toBe(0);
  });

  it('統計情報を取得できる', async () => {
    await store.store({ content: '事実1', category: 'fact' });
    await store.store({ content: '決定1', category: 'decision' });

    const stats = await store.stats();
    expect(stats.totalEntries).toBe(2);
    expect(stats.byCategory.fact).toBe(1);
    expect(stats.byCategory.decision).toBe(1);
    expect(stats.embeddingProvider).toBe('ollama');
    expect(stats.embeddingDimension).toBe(4);
  });

  it('エクスポートで全件取得できる', async () => {
    await store.store({ content: 'エクスポート1', category: 'fact' });
    await store.store({ content: 'エクスポート2', category: 'preference' });

    const exported = await store.exportAll();
    expect(exported.length).toBe(2);
  });

  it('デフォルトスコープが適用される', async () => {
    const entry = await store.store({ content: 'スコープテスト' });
    expect(entry.scope).toBe('global');
  });

  it('カスタムスコープを指定できる', async () => {
    const entry = await store.store({ content: 'プロジェクト記憶', scope: 'project' });
    expect(entry.scope).toBe('project');

    const projectEntries = await store.list({ scope: 'project' });
    expect(projectEntries.length).toBe(1);
  });
});
