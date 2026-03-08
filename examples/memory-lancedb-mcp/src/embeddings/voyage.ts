import type { EmbeddingProvider, EmbeddingProviderType } from '../types.js';

const DIMENSIONS: Record<string, number> = {
  'voyage-3-lite': 512,
  'voyage-3': 1024,
  'voyage-3-large': 1024,
  'voyage-code-3': 1024,
};

export class VoyageEmbedding implements EmbeddingProvider {
  readonly name: EmbeddingProviderType = 'voyage';
  readonly dimension: number;

  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'voyage-3-lite',
  ) {
    this.dimension = DIMENSIONS[this.model] ?? 512;
  }

  async embed(text: string): Promise<number[]> {
    const [result] = await this.embedBatch([text]);
    return result;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: texts,
        input_type: 'document',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voyage AI Embedding APIエラー (${response.status}): ${error}`);
    }

    const data = await response.json() as {
      data: Array<{ embedding: number[]; index: number }>;
    };

    return data.data
      .sort((a, b) => a.index - b.index)
      .map((d) => d.embedding);
  }
}
