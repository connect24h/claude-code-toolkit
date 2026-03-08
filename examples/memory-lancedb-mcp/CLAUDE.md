# memory-lancedb-mcp

LanceDBベースのセマンティックメモリMCPサーバー。

## 技術スタック

- **言語**: TypeScript (ES2022+, strict mode)
- **MCP**: @modelcontextprotocol/sdk v1.12
- **ベクトルDB**: LanceDB v0.26（ローカル、サーバー不要）
- **テスト**: Vitest (32テスト)

## Embeddingプロバイダー（7種対応）

### CLI × Ollama ハイブリッド（推奨）

CLIでテキストを意味的に正規化 → Ollamaでベクトル化。APIキー不要。

| プロバイダー | CLI | Ollamaモデル | 次元数 | 環境変数 |
|-------------|-----|-------------|--------|---------|
| `codex-ollama` | Codex CLI | nomic-embed-text | 768 | MEMORY_EMBEDDING_PROVIDER |
| `gemini-ollama` | Gemini CLI | nomic-embed-text | 768 | MEMORY_EMBEDDING_PROVIDER |
| `claude-ollama` | Claude Code CLI | nomic-embed-text | 768 | MEMORY_EMBEDDING_PROVIDER |

### Ollama直接（最速）

| プロバイダー | モデル | 次元数 | 備考 |
|-------------|--------|--------|------|
| `ollama` | nomic-embed-text | 768 | デフォルト。CLI正規化なし |

### API直接（要APIキー）

| プロバイダー | モデル | 次元数 | 環境変数 |
|-------------|--------|--------|---------|
| `openai` | text-embedding-3-small | 1536 | OPENAI_API_KEY |
| `gemini` | text-embedding-004 | 768 | GEMINI_API_KEY |
| `voyage` | voyage-3-lite | 512 | VOYAGE_API_KEY |

## プロバイダー切り替え

```bash
# 起動スクリプトで指定
MEMORY_EMBEDDING_PROVIDER=codex-ollama  # Codex CLI × Ollama
MEMORY_EMBEDDING_PROVIDER=gemini-ollama # Gemini CLI × Ollama
MEMORY_EMBEDDING_PROVIDER=claude-ollama # Claude Code CLI × Ollama
MEMORY_EMBEDDING_PROVIDER=ollama        # Ollama直接（デフォルト）
```

## MCPツール

| ツール | 説明 |
|--------|------|
| memory_store | 記憶保存（カテゴリ・スコープ・タグ・重要度付き） |
| memory_recall | セマンティック検索（ベクトル類似度 + 時間減衰 + 重要度） |
| memory_forget | ID指定で削除 |
| memory_list | 一覧取得（フィルタ対応） |
| memory_stats | 統計情報 |
| memory_export | Markdown/JSONエクスポート |

## コマンド

```bash
npm test           # テスト実行
npm run typecheck  # 型チェック
npm start          # MCPサーバー起動（stdio）
```

## データ保存先

- LanceDB: `~/.local/share/memory-lancedb/lancedb/`
- Markdown監査ログ: `~/.local/share/memory-lancedb/markdown/`

## 注意事項

- Ollama使用時は事前に `ollama pull nomic-embed-text` が必要
- CLI×Ollamaハイブリッド: 50文字未満のテキストはCLI処理をスキップ（コスト節約）
- CLI失敗時は自動でOllamaのみにフォールバック
- プロバイダー変更時、次元数が変わる場合はDBを再作成する必要あり
- claude-ollama使用時はネスト回避のためCLAUDECODE環境変数を自動除去
