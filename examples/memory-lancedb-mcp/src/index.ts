import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMemoryServer } from './server.js';
import type { ServerConfig, EmbeddingProviderType } from './types.js';
import { detectAvailableProvider } from './embeddings/index.js';
import { join } from 'node:path';
import { homedir } from 'node:os';

function parseArgs(): Partial<ServerConfig> {
  const args = process.argv.slice(2);
  const config: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--') && args[i + 1]) {
      config[arg.slice(2)] = args[i + 1];
      i++;
    }
  }

  return {
    embedding: {
      provider: (config.provider as EmbeddingProviderType) ?? undefined!,
      apiKey: config['api-key'],
      model: config.model,
      baseUrl: config['base-url'],
    },
    dbPath: config['db-path'],
    markdownPath: config['markdown-path'],
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  const home = homedir();

  // プロバイダー決定（引数 > 環境変数 > 自動検出）
  const provider = args.embedding?.provider
    ?? (process.env.MEMORY_EMBEDDING_PROVIDER as EmbeddingProviderType)
    ?? detectAvailableProvider()
    ?? 'ollama';

  const config: ServerConfig = {
    embedding: {
      provider,
      apiKey: args.embedding?.apiKey ?? process.env.MEMORY_EMBEDDING_API_KEY,
      model: args.embedding?.model ?? process.env.MEMORY_EMBEDDING_MODEL,
      baseUrl: args.embedding?.baseUrl ?? process.env.OLLAMA_BASE_URL,
    },
    dbPath: args.dbPath ?? process.env.MEMORY_DB_PATH ?? join(home, '.local', 'share', 'memory-lancedb', 'lancedb'),
    markdownPath: args.markdownPath ?? process.env.MEMORY_MARKDOWN_PATH ?? join(home, '.local', 'share', 'memory-lancedb', 'markdown'),
    defaultScope: 'global',
  };

  process.stderr.write(`[memory-lancedb-mcp] プロバイダー: ${config.embedding.provider}\n`);
  process.stderr.write(`[memory-lancedb-mcp] DB: ${config.dbPath}\n`);

  const server = createMemoryServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: Error) => {
  process.stderr.write(`[memory-lancedb-mcp] 致命的エラー: ${err.message}\n`);
  process.exit(1);
});
