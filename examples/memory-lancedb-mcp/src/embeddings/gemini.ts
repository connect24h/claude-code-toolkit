import type { EmbeddingProvider, EmbeddingProviderType } from '../types.js';

const DIMENSIONS: Record<string, number> = {
  'text-embedding-004': 768,
  'embedding-001': 768,
};

export class GeminiEmbedding implements EmbeddingProvider {
  readonly name: EmbeddingProviderType = 'gemini';
  readonly dimension: number;

  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'text-embedding-004',
  ) {
    this.dimension = DIMENSIONS[this.model] ?? 768;
  }

  async embed(text: string): Promise<number[]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:embedContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: `models/${this.model}`,
        content: { parts: [{ text }] },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini Embedding APIエラー (${response.status}): ${error}`);
    }

    const data = await response.json() as {
      embedding: { values: number[] };
    };

    return data.embedding.values;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:batchEmbedContents?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: texts.map((text) => ({
          model: `models/${this.model}`,
          content: { parts: [{ text }] },
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini Batch Embedding APIエラー (${response.status}): ${error}`);
    }

    const data = await response.json() as {
      embeddings: Array<{ values: number[] }>;
    };

    return data.embeddings.map((e) => e.values);
  }
}
