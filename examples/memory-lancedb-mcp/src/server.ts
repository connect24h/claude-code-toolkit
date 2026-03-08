import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MemoryStore } from './memory-store.js';
import { hybridSearch } from './search.js';
import { mirrorToMarkdown, exportSummaryMarkdown } from './markdown-mirror.js';
import type { ServerConfig, MemoryCategory, MemoryScope } from './types.js';
import { createEmbeddingProvider } from './embeddings/index.js';

const CATEGORIES: MemoryCategory[] = ['preference', 'fact', 'decision', 'entity', 'learning', 'other'];
const SCOPES: MemoryScope[] = ['global', 'project', 'agent'];

export function createMemoryServer(config: ServerConfig): McpServer {
  const embedding = createEmbeddingProvider(config.embedding);
  const store = new MemoryStore(config.dbPath, embedding, config.defaultScope);

  const server = new McpServer({
    name: 'memory-lancedb',
    version: '1.0.0',
  });

  // memory_store: 記憶を保存
  server.tool(
    'memory_store',
    '記憶を保存する。事実、決定、ユーザーの好み、学習内容を永続化。',
    {
      content: z.string().describe('保存する記憶の内容'),
      category: z.enum(CATEGORIES as [string, ...string[]]).optional().describe('カテゴリ: preference/fact/decision/entity/learning/other'),
      scope: z.enum(SCOPES as [string, ...string[]]).optional().describe('スコープ: global/project/agent'),
      tags: z.array(z.string()).optional().describe('タグ（検索用）'),
      importance: z.number().min(1).max(10).optional().describe('重要度 1-10（デフォルト: 5）'),
      source: z.string().optional().describe('情報源'),
    },
    async (params) => {
      try {
        await store.init();
        const entry = await store.store({
          content: params.content,
          category: params.category as MemoryCategory | undefined,
          scope: params.scope as MemoryScope | undefined,
          tags: params.tags,
          importance: params.importance,
          source: params.source,
        });

        // Markdownミラー
        await mirrorToMarkdown(entry, config.markdownPath);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                status: 'stored',
                id: entry.id,
                category: entry.category,
                scope: entry.scope,
              }, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `エラー: ${(error as Error).message}` }],
          isError: true,
        };
      }
    },
  );

  // memory_recall: セマンティック検索
  server.tool(
    'memory_recall',
    '関連する記憶をセマンティック検索で呼び出す。過去の事実、決定、好みを参照。',
    {
      query: z.string().describe('検索クエリ'),
      scope: z.enum(SCOPES as [string, ...string[]]).optional().describe('スコープフィルタ'),
      category: z.enum(CATEGORIES as [string, ...string[]]).optional().describe('カテゴリフィルタ'),
      limit: z.number().min(1).max(50).optional().describe('結果件数（デフォルト: 5）'),
      minScore: z.number().min(0).max(1).optional().describe('最小スコア（デフォルト: 0.3）'),
    },
    async (params) => {
      try {
        await store.init();
        const results = await hybridSearch(store, {
          query: params.query,
          scope: params.scope as MemoryScope | undefined,
          category: params.category as MemoryCategory | undefined,
          limit: params.limit ?? 5,
          minScore: params.minScore,
        });

        if (results.length === 0) {
          return {
            content: [{ type: 'text' as const, text: '関連する記憶が見つかりませんでした。' }],
          };
        }

        const formatted = results.map((r, i) => ({
          rank: i + 1,
          score: r.score,
          category: r.entry.category,
          scope: r.entry.scope,
          content: r.entry.content,
          tags: r.entry.tags,
          createdAt: r.entry.createdAt,
        }));

        return {
          content: [{ type: 'text' as const, text: JSON.stringify(formatted, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `エラー: ${(error as Error).message}` }],
          isError: true,
        };
      }
    },
  );

  // memory_forget: 記憶を削除
  server.tool(
    'memory_forget',
    '指定IDの記憶を削除する。',
    {
      id: z.string().describe('削除する記憶のID'),
    },
    async (params) => {
      try {
        await store.init();
        const deleted = await store.forget(params.id);
        return {
          content: [{
            type: 'text' as const,
            text: deleted ? `記憶 ${params.id} を削除しました。` : `記憶 ${params.id} が見つかりませんでした。`,
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `エラー: ${(error as Error).message}` }],
          isError: true,
        };
      }
    },
  );

  // memory_list: 記憶一覧
  server.tool(
    'memory_list',
    '保存された記憶の一覧を取得する。フィルタ条件指定可能。',
    {
      scope: z.enum(SCOPES as [string, ...string[]]).optional().describe('スコープフィルタ'),
      category: z.enum(CATEGORIES as [string, ...string[]]).optional().describe('カテゴリフィルタ'),
      tag: z.string().optional().describe('タグフィルタ'),
      limit: z.number().min(1).max(100).optional().describe('件数（デフォルト: 20）'),
      offset: z.number().min(0).optional().describe('オフセット'),
    },
    async (params) => {
      try {
        await store.init();
        const entries = await store.list({
          scope: params.scope as MemoryScope | undefined,
          category: params.category as MemoryCategory | undefined,
          tag: params.tag,
          limit: params.limit ?? 20,
          offset: params.offset,
        });

        const formatted = entries.map((e) => ({
          id: e.id,
          category: e.category,
          scope: e.scope,
          importance: e.importance,
          content: e.content.slice(0, 100) + (e.content.length > 100 ? '...' : ''),
          tags: e.tags,
          createdAt: e.createdAt,
        }));

        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({ count: formatted.length, entries: formatted }, null, 2),
          }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `エラー: ${(error as Error).message}` }],
          isError: true,
        };
      }
    },
  );

  // memory_stats: 統計情報
  server.tool(
    'memory_stats',
    'メモリストアの統計情報を取得する。',
    {},
    async () => {
      try {
        await store.init();
        const stats = await store.stats();
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(stats, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `エラー: ${(error as Error).message}` }],
          isError: true,
        };
      }
    },
  );

  // memory_export: エクスポート
  server.tool(
    'memory_export',
    '全記憶をMarkdownまたはJSON形式でエクスポートする。',
    {
      format: z.enum(['markdown', 'json']).optional().describe('出力形式（デフォルト: markdown）'),
    },
    async (params) => {
      try {
        await store.init();
        const entries = await store.exportAll();

        if (params.format === 'json') {
          return {
            content: [{
              type: 'text' as const,
              text: JSON.stringify(entries.map(({ vector, ...rest }) => rest), null, 2),
            }],
          };
        }

        const filePath = await exportSummaryMarkdown(entries, config.markdownPath);
        return {
          content: [{ type: 'text' as const, text: `エクスポート完了: ${filePath}\n${entries.length} 件の記憶をエクスポートしました。` }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text' as const, text: `エラー: ${(error as Error).message}` }],
          isError: true,
        };
      }
    },
  );

  return server;
}
