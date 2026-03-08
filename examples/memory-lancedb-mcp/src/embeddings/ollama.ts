import type { EmbeddingProvider, EmbeddingProviderType } from '../types.js';

const DIMENSIONS: Record<string, number> = {
  'nomic-embed-text': 768,
  'all-minilm': 384,
  'mxbai-embed-large': 1024,
  'snowflake-arctic-embed': 1024,
};

export class OllamaEmbedding implements EmbeddingProvider {
  readonly name: EmbeddingProviderType = 'ollama';
  readonly dimension: number;

  constructor(
    private readonly baseUrl: string = 'http://localhost:11434',
    private readonly model: string = 'nomic-embed-text',
  ) {
    this.dimension = DIMENSIONS[this.model] ?? 768;
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama Embedding APIエラー (${response.status}): ${error}`);
    }

    const data = await response.json() as {
      embeddings: number[][];
    };

    return data.embeddings[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama Batch Embedding APIエラー (${response.status}): ${error}`);
    }

    const data = await response.json() as {
      embeddings: number[][];
    };

    return data.embeddings;
  }
}
