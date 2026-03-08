import { describe, it, expect } from 'vitest';
import { OpenAIEmbedding } from '../src/embeddings/openai.js';
import { GeminiEmbedding } from '../src/embeddings/gemini.js';
import { VoyageEmbedding } from '../src/embeddings/voyage.js';
import { OllamaEmbedding } from '../src/embeddings/ollama.js';
import { CodexOllamaEmbedding, GeminiOllamaEmbedding, ClaudeOllamaEmbedding } from '../src/embeddings/cli-ollama.js';
import { createEmbeddingProvider, detectAvailableProvider } from '../src/embeddings/index.js';

describe('Embeddingプロバイダー初期化', () => {
  it('OpenAI: 正しいdimensionを持つ', () => {
    const emb = new OpenAIEmbedding('test-key', 'text-embedding-3-small');
    expect(emb.name).toBe('openai');
    expect(emb.dimension).toBe(1536);
  });

  it('OpenAI: text-embedding-3-largeは3072', () => {
    const emb = new OpenAIEmbedding('test-key', 'text-embedding-3-large');
    expect(emb.dimension).toBe(3072);
  });

  it('Gemini: 正しいdimensionを持つ', () => {
    const emb = new GeminiEmbedding('test-key', 'text-embedding-004');
    expect(emb.name).toBe('gemini');
    expect(emb.dimension).toBe(768);
  });

  it('Voyage: 正しいdimensionを持つ', () => {
    const emb = new VoyageEmbedding('test-key', 'voyage-3-lite');
    expect(emb.name).toBe('voyage');
    expect(emb.dimension).toBe(512);
  });

  it('Voyage: voyage-3は1024', () => {
    const emb = new VoyageEmbedding('test-key', 'voyage-3');
    expect(emb.dimension).toBe(1024);
  });

  it('Ollama: 正しいdimensionを持つ', () => {
    const emb = new OllamaEmbedding('http://localhost:11434', 'nomic-embed-text');
    expect(emb.name).toBe('ollama');
    expect(emb.dimension).toBe(768);
  });

  it('Ollama: all-minilmは384', () => {
    const emb = new OllamaEmbedding('http://localhost:11434', 'all-minilm');
    expect(emb.dimension).toBe(384);
  });
});

describe('CLI × Ollama ハイブリッドプロバイダー初期化', () => {
  it('Codex × Ollama: 正しいname/dimensionを持つ', () => {
    const emb = new CodexOllamaEmbedding();
    expect(emb.name).toBe('codex-ollama');
    expect(emb.dimension).toBe(768);
  });

  it('Gemini × Ollama: 正しいname/dimensionを持つ', () => {
    const emb = new GeminiOllamaEmbedding();
    expect(emb.name).toBe('gemini-ollama');
    expect(emb.dimension).toBe(768);
  });

  it('Claude × Ollama: 正しいname/dimensionを持つ', () => {
    const emb = new ClaudeOllamaEmbedding();
    expect(emb.name).toBe('claude-ollama');
    expect(emb.dimension).toBe(768);
  });

  it('カスタムOllamaモデル指定が反映される', () => {
    const emb = new CodexOllamaEmbedding('http://localhost:11434', 'all-minilm');
    expect(emb.dimension).toBe(384);
  });
});

describe('createEmbeddingProvider', () => {
  it('openaiプロバイダーを生成', () => {
    const provider = createEmbeddingProvider({ provider: 'openai', apiKey: 'test' });
    expect(provider.name).toBe('openai');
  });

  it('geminiプロバイダーを生成', () => {
    const provider = createEmbeddingProvider({ provider: 'gemini', apiKey: 'test' });
    expect(provider.name).toBe('gemini');
  });

  it('voyageプロバイダーを生成', () => {
    const provider = createEmbeddingProvider({ provider: 'voyage', apiKey: 'test' });
    expect(provider.name).toBe('voyage');
  });

  it('ollamaプロバイダーを生成', () => {
    const provider = createEmbeddingProvider({ provider: 'ollama' });
    expect(provider.name).toBe('ollama');
  });

  it('codex-ollamaプロバイダーを生成', () => {
    const provider = createEmbeddingProvider({ provider: 'codex-ollama' });
    expect(provider.name).toBe('codex-ollama');
  });

  it('gemini-ollamaプロバイダーを生成', () => {
    const provider = createEmbeddingProvider({ provider: 'gemini-ollama' });
    expect(provider.name).toBe('gemini-ollama');
  });

  it('claude-ollamaプロバイダーを生成', () => {
    const provider = createEmbeddingProvider({ provider: 'claude-ollama' });
    expect(provider.name).toBe('claude-ollama');
  });

  it('未対応プロバイダーでエラー', () => {
    expect(() => createEmbeddingProvider({ provider: 'unknown' as never })).toThrow('未対応');
  });
});

describe('detectAvailableProvider', () => {
  it('デフォルトはollamaを返す', () => {
    expect(detectAvailableProvider()).toBe('ollama');
  });
});
