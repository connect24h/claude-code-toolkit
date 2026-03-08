import { execFile } from 'node:child_process';
import { writeFile, unlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { OllamaEmbedding } from './ollama.js';
import type { EmbeddingProvider, EmbeddingProviderType } from '../types.js';

const NORMALIZE_PROMPT = `以下のテキストから記憶検索に最適なキーワードと要約を抽出してください。
出力は「キーワード: word1, word2, ... 要約: 一文の要約」の形式のみ。余計な説明は不要。

テキスト:
`;

/** CLIコマンドを非対話で実行し、出力テキストを返す */
function runCli(command: string, args: string[], timeout = 30000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(command, args, {
      timeout,
      maxBuffer: 1024 * 1024,
      env: { ...process.env, CLAUDECODE: undefined },
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`CLI実行エラー (${command}): ${error.message}`));
        return;
      }
      resolve(stdout.trim() || stderr.trim());
    });
  });
}

/** CLI × Ollama ハイブリッドEmbeddingプロバイダー */
export class CliOllamaEmbedding implements EmbeddingProvider {
  readonly dimension: number;
  private readonly ollama: OllamaEmbedding;
  private readonly cliCommand: string;
  private readonly cliArgs: (prompt: string) => string[];

  constructor(
    readonly name: EmbeddingProviderType,
    cliCommand: string,
    cliArgsBuilder: (prompt: string) => string[],
    ollamaBaseUrl: string = 'http://localhost:11434',
    ollamaModel: string = 'nomic-embed-text',
  ) {
    this.ollama = new OllamaEmbedding(ollamaBaseUrl, ollamaModel);
    this.dimension = this.ollama.dimension;
    this.cliCommand = cliCommand;
    this.cliArgs = cliArgsBuilder;
  }

  /** CLIでテキストを意味的に正規化する */
  private async normalize(text: string): Promise<string> {
    // 短いテキストはCLI処理をスキップ（コスト節約）
    if (text.length < 50) {
      return text;
    }

    try {
      const prompt = NORMALIZE_PROMPT + text;
      const result = await runCli(this.cliCommand, this.cliArgs(prompt));
      // CLI出力が空ならオリジナルを使用
      return result.length > 0 ? result : text;
    } catch {
      // CLI失敗時はオリジナルテキストでフォールバック
      return text;
    }
  }

  async embed(text: string): Promise<number[]> {
    const normalized = await this.normalize(text);
    return this.ollama.embed(normalized);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const normalized = await Promise.all(texts.map((t) => this.normalize(t)));
    return this.ollama.embedBatch(normalized);
  }
}

/** Codex CLI × Ollama */
export class CodexOllamaEmbedding extends CliOllamaEmbedding {
  constructor(
    ollamaBaseUrl: string = 'http://localhost:11434',
    ollamaModel: string = 'nomic-embed-text',
  ) {
    super(
      'codex-ollama',
      'codex',
      (prompt: string) => [
        'exec',
        '--skip-git-repo-check',
        '-o', '/dev/stdout',
        prompt,
      ],
      ollamaBaseUrl,
      ollamaModel,
    );
  }
}

/** Gemini CLI × Ollama */
export class GeminiOllamaEmbedding extends CliOllamaEmbedding {
  constructor(
    ollamaBaseUrl: string = 'http://localhost:11434',
    ollamaModel: string = 'nomic-embed-text',
  ) {
    super(
      'gemini-ollama',
      'gemini',
      (prompt: string) => [prompt],
      ollamaBaseUrl,
      ollamaModel,
    );
  }
}

/** Claude Code CLI × Ollama */
export class ClaudeOllamaEmbedding extends CliOllamaEmbedding {
  constructor(
    ollamaBaseUrl: string = 'http://localhost:11434',
    ollamaModel: string = 'nomic-embed-text',
  ) {
    super(
      'claude-ollama',
      'claude',
      (prompt: string) => ['-p', prompt],
      ollamaBaseUrl,
      ollamaModel,
    );
  }
}
