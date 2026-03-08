import type { EmbeddingProvider, EmbeddingConfig, EmbeddingProviderType } from '../types.js';
import { OpenAIEmbedding } from './openai.js';
import { GeminiEmbedding } from './gemini.js';
import { VoyageEmbedding } from './voyage.js';
import { OllamaEmbedding } from './ollama.js';
import { CodexOllamaEmbedding, GeminiOllamaEmbedding, ClaudeOllamaEmbedding } from './cli-ollama.js';

export { OpenAIEmbedding } from './openai.js';
export { GeminiEmbedding } from './gemini.js';
export { VoyageEmbedding } from './voyage.js';
export { OllamaEmbedding } from './ollama.js';
export { CodexOllamaEmbedding, GeminiOllamaEmbedding, ClaudeOllamaEmbedding } from './cli-ollama.js';

/** Embeddingプロバイダーを生成するファクトリ */
export function createEmbeddingProvider(config: EmbeddingConfig): EmbeddingProvider {
  const ollamaUrl = config.baseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
  const ollamaModel = config.model ?? 'nomic-embed-text';

  switch (config.provider) {
    case 'codex-ollama':
      return new CodexOllamaEmbedding(ollamaUrl, ollamaModel);
    case 'gemini-ollama':
      return new GeminiOllamaEmbedding(ollamaUrl, ollamaModel);
    case 'claude-ollama':
      return new ClaudeOllamaEmbedding(ollamaUrl, ollamaModel);
    case 'ollama':
      return new OllamaEmbedding(ollamaUrl, ollamaModel);
    case 'openai':
      return new OpenAIEmbedding(
        config.apiKey ?? process.env.OPENAI_API_KEY ?? '',
        config.model ?? 'text-embedding-3-small',
      );
    case 'gemini':
      return new GeminiEmbedding(
        config.apiKey ?? process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? '',
        config.model ?? 'text-embedding-004',
      );
    case 'voyage':
      return new VoyageEmbedding(
        config.apiKey ?? process.env.VOYAGE_API_KEY ?? '',
        config.model ?? 'voyage-3-lite',
      );
    default:
      throw new Error(`未対応のEmbeddingプロバイダー: ${config.provider as string}`);
  }
}

/** 自動検出: 利用可能なプロバイダーを優先順位で返す */
export function detectAvailableProvider(): EmbeddingProviderType {
  // CLI × Ollama ハイブリッドを優先（APIキー不要）
  // Ollamaは常にフォールバック
  return 'ollama';
}
