# 実装レポート - AIエージェント基盤

最終更新: 2026-03-08

## 概要

Claude Codeエージェント基盤で管理する全プロジェクト。

| プロジェクト | 種別 | 言語 | テスト | 主要技術 | デプロイ |
|-------------|------|------|--------|---------|---------|
| AssetFinanceApp | 自動化 | TypeScript | 20件 | Claude CLI, yahoo-finance2, Slack | systemd timer (7:00) |
| iketomo_ch | 自動化 | Bash | - | yt-dlp, Codex CLI, jq | cron (6:00/7:00) |
| manual-generator | CLIツール | TypeScript | 38件 | Playwright, Sharp, PptxGenJS | 手動実行 |
| memory-lancedb-mcp | MCPサーバー | TypeScript | 39件 | LanceDB, Ollama, 7プロバイダー | MCP常駐 |
| mail-to-slack | デーモン | TypeScript | 9件 | IMAP, Slack API, Google Calendar | cron (5分) |
| moneyforward | スナップショット | Python 3 | - | Playwright, pyotp | 手動実行 |
| marp-slides | プレゼン生成 | Marp/CSS | - | Marp CLI, カスタムテーマ | `/marp` スキル |
| Auto Memory Hooks | フック | JavaScript | - | Ollama, LanceDB | セッション自動 |

---

## 1. manual-generator - マニュアル自動生成ツール

**パス**: `$HOME/manual-generator/`

### 目的

認証付きWebアプリの画面キャプチャ → アノテーション付与 → 複数フォーマットでマニュアル生成を自動化する。

### アーキテクチャ

```
YAML設定 → 認証・画面キャプチャ(Playwright) → SVGアノテーション生成 → 画像合成(Sharp) → ドキュメント生成
```

### ディレクトリ構成

```
src/
├── index.ts              # CLIエントリポイント
├── types.ts              # 12型定義
├── config-loader.ts      # YAML解析・${ENV_VAR}展開・バリデーション
├── capturer.ts           # Playwright自動操作・スクリーンショット
├── annotator.ts          # Sharp合成パイプライン (SVG → Buffer → PNG)
├── svg-builder.ts        # SVGアノテーション生成
└── generators/
    ├── index.ts          # ジェネレータファクトリ
    ├── markdown.ts       # Markdown + base64画像埋め込み
    ├── pptx.ts           # PowerPoint (左60%画像 + 右40%説明)
    ├── xlsx.ts           # Excel (目次シート + ページ別シート)
    └── docx.ts           # Word (カバー + 目次 + ページ別コンテンツ)
```

### 技術スタック

| 技術 | 用途 |
|------|------|
| Playwright (chromium) | ブラウザ自動操作・スクリーンショット |
| Sharp | SVG→PNG画像合成 |
| PptxGenJS | PowerPoint生成 |
| ExcelJS | Excel生成 |
| docx | Word生成 |
| js-yaml | YAML設定解析 |

### YAML設定例

```yaml
title: "管理画面マニュアル"
baseUrl: "https://app.example.com"
auth:
  - action: fill
    selector: "#email"
    value: "${ADMIN_EMAIL}"
  - action: click
    selector: "#login-btn"
pages:
  - title: "ダッシュボード"
    path: "/dashboard"
    annotations:
      - type: highlight
        selector: ".stats-panel"
        label: "統計情報パネル"
      - type: arrow
        from: ".menu"
        to: ".content"
        label: "ナビゲーション"
```

### コマンド

```bash
npx tsx src/index.ts <config.yaml> --format md,pptx,xlsx,docx --output ./output
npm test              # 38テスト実行
npm run typecheck     # 型チェック
```

### Claude Codeスキル

`/manual` コマンドで呼び出し可能。トリガー: 「マニュアル作成」「操作手順書」等。

---

## 2. memory-lancedb-mcp - セマンティックメモリMCPサーバー

**パス**: `$HOME/memory-lancedb-mcp/`

### 目的

LanceDBベースのベクトル検索でClaudeに永続的なセマンティックメモリを提供する。セッション間で事実・決定・好み・学習を記憶・想起する。

### アーキテクチャ

```
Claude Code ←(MCP stdio)→ server.ts → memory-store.ts → LanceDB
                                     → search.ts (ベクトル類似度 + 時間減衰 + 重要度)
                                     → embeddings/ (7プロバイダー)
```

### ディレクトリ構成

```
src/
├── index.ts              # エントリポイント (--provider引数・環境変数検出)
├── types.ts              # 型定義 (7プロバイダータイプ)
├── server.ts             # MCP 6ツール定義
├── memory-store.ts       # LanceDB CRUD (store/vectorSearch/list/forget/stats/export)
├── search.ts             # ハイブリッド検索 (vector:0.65 + recency:0.2 + importance:0.15)
├── scoring.ts            # 時間減衰(半減期30日) + 重要度正規化(1-10)
├── markdown-mirror.ts    # Markdown監査ログ
└── embeddings/
    ├── index.ts          # プロバイダーファクトリ
    ├── ollama.ts         # Ollama直接 (デフォルト・最速)
    ├── cli-ollama.ts     # CLI×Ollamaハイブリッド (Codex/Gemini/Claude)
    ├── openai.ts         # OpenAI API
    ├── gemini.ts         # Gemini API
    └── voyage.ts         # Voyage API
```

### Embeddingプロバイダー (7種)

#### CLI × Ollama ハイブリッド（推奨）

CLIでテキストを意味的に正規化 → Ollamaでベクトル化。APIキー不要。

| プロバイダー | CLI | Ollamaモデル | 次元数 |
|-------------|-----|-------------|--------|
| `codex-ollama` | Codex CLI | nomic-embed-text | 768 |
| `gemini-ollama` | Gemini CLI | nomic-embed-text | 768 |
| `claude-ollama` | Claude Code CLI | nomic-embed-text | 768 |

#### Ollama直接（最速・デフォルト）

| プロバイダー | モデル | 次元数 |
|-------------|--------|--------|
| `ollama` | nomic-embed-text | 768 |

#### API直接（要APIキー）

| プロバイダー | モデル | 次元数 |
|-------------|--------|--------|
| `openai` | text-embedding-3-small | 1536 |
| `gemini` | text-embedding-004 | 768 |
| `voyage` | voyage-3-lite | 512 |

### MCPツール

| ツール | 説明 |
|--------|------|
| `memory_store` | 記憶保存（カテゴリ・スコープ・タグ・重要度付き） |
| `memory_recall` | セマンティック検索（ベクトル類似度 + 時間減衰 + 重要度） |
| `memory_forget` | ID指定で削除 |
| `memory_list` | 一覧取得（フィルタ対応） |
| `memory_stats` | 統計情報（件数・カテゴリ別・DBサイズ・プロバイダー） |
| `memory_export` | Markdown/JSONエクスポート |

### スコアリング

```
最終スコア = ベクトル類似度(0.65) + 時間減衰(0.2) + 重要度(0.15)
```

- **時間減衰**: 半減期30日の指数関数
- **重要度**: 1-10スケールを0.1-1.0に正規化

### データ保存先

| データ | パス |
|--------|------|
| LanceDB | `~/.local/share/memory-lancedb/lancedb/` |
| Markdown監査ログ | `~/.local/share/memory-lancedb/markdown/` |

### デプロイ

```bash
# MCP設定 (settings.json)
"memory": {
  "command": "bash",
  "args": ["$HOME/.claude/scripts/memory-lancedb-mcp.sh"]
}

# 起動スクリプト
MEMORY_EMBEDDING_PROVIDER=ollama  # デフォルト
```

---

## 3. mail-to-slack - メール監視 + Teams→Googleカレンダー連携

**パス**: `$HOME/mail-to-slack/`

### 目的

user@example.co.jp 宛メールを5分間隔で監視し、新着メールをSlackに通知。Teams会議招待はGoogleカレンダーに自動登録する。

### アーキテクチャ

```
Cron (5分) → run.sh (SOPS復号) → index.ts
  ├─ IMAP接続 → 新着メール取得 (UID追跡)
  ├─ Slack投稿 (全メール一覧)
  ├─ Teams会議検出 (ICS/件名/本文)
  ├─ Googleカレンダー登録
  ├─ Slack確認通知
  └─ last-uid.json 更新
```

### ディレクトリ構成

```
src/
├── index.ts              # メインオーケストレーター
├── config.ts             # 設定管理 (環境変数)
├── types.ts              # 型定義 (MailMessage, TeamsEvent, MailState)
├── imap-client.ts        # IMAP接続・メール取得 (imapflow)
├── teams-parser.ts       # Teams会議招待パース (ICS + 本文)
├── slack.ts              # Slack Block Kit投稿
├── calendar.ts           # Google Calendar API書き込み
├── state.ts              # UID状態管理 (JSON永続化)
├── teams-parser.test.ts  # 5テスト
└── state.test.ts         # 4テスト
scripts/
└── google-auth.ts        # OAuth再認証ヘルパー
```

### 接続先

| サービス | 接続情報 |
|---------|---------|
| IMAP | imap.example.co.jp:993 (SSL/TLS, TLS検証スキップ) |
| Slack | #all-claude-code-manager (C0AH8CMPEL8) |
| Google Calendar | user@gmail.com (calendar書き込みスコープ) |

### Teams会議検出

1. **ICS添付ファイル**を優先解析（DTSTART/DTEND/SUMMARY/ORGANIZER）
2. **メール本文**からフォールバック（日時パターン + Teams URLパターン）
3. 件名に `Microsoft Teams` / `Teams Meeting` / `Teams 会議` を含む場合にフラグ

### Slack通知フォーマット

```
📬 新着メール (3件)
──────────────
*件名* 🟣Teams会議
📤 sender@example.com
🕐 2026/3/8 17:34:20
> 本文プレビュー（300文字以内）...
──────────────
```

カレンダー登録時は追加で確認通知:
```
✅ Googleカレンダーに登録しました
*会議名*
📅 開始 ～ 終了
👤 主催者
🔗 Teams参加リンク
```

### シークレット管理

```bash
# .env.enc (SOPS+age暗号化)
IMAP_HOST / IMAP_PORT / IMAP_USER / IMAP_PASSWORD
SLACK_BOT_TOKEN / SLACK_CHANNEL_ID
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN
GOOGLE_CALENDAR_ID
```

### Cron設定

```cron
*/5 * * * * $HOME/mail-to-slack/run.sh >> $HOME/mail-to-slack/logs/cron.log 2>&1
```

### run.sh フロー

1. SOPS復号 → `.env` 生成 (chmod 600)
2. trap で終了時に `.env` 自動削除
3. 環境変数をsource → tsx実行

### Google Calendar認証

```bash
# 書き込み権限が必要な場合（初回 or トークン期限切れ）
npx tsx scripts/google-auth.ts
# → ブラウザ認証 → refresh_token更新 → .env.enc再暗号化
```

---

## 4. Auto Memory Hooks - セッション間記憶の自動化

**パス**: `$HOME/.claude/scripts/hooks/`

### 目的

Claude Codeセッションの開始・終了時にLanceDBの記憶を自動で想起・保存する。ユーザーの明示的な操作なしに記憶が蓄積・活用される。

### フック構成

#### memory-recall.js (SessionStart)

| 項目 | 詳細 |
|------|------|
| トリガー | セッション開始時 |
| タイムアウト | 10秒 |
| 機能 | LanceDBから重要度×新しさでTOP 5記憶を取得し、コンテキストに注入 |

**出力形式:**
```xml
<relevant-memories>
- [fact] (重要度:8) メールサーバーはポート587 [tags: auto-capture]
- [decision] (重要度:7) Ollamaをデフォルトプロバイダーに採用 [tags: auto-capture]
</relevant-memories>
```

#### memory-capture.js (Stop)

| 項目 | 詳細 |
|------|------|
| トリガー | 各レスポンス後 |
| タイムアウト | 15秒 |
| 機能 | ユーザーメッセージからパターン検出 → Ollama埋め込み → LanceDB保存 |

**キャプチャパターン:**

| パターン | カテゴリ | 例 |
|---------|---------|-----|
| `覚えて\|記憶して\|remember` | fact | 「これを覚えて」 |
| `好み\|prefer\|いつも.*使う` | preference | 「bunを使う好み」 |
| `に決めた\|decided\|採用する` | decision | 「Ollamaに決めた」 |
| `学んだ\|わかった\|教訓` | learning | 「型キャストが必要と学んだ」 |
| `設定\|config\|ポート\|URL` | fact | 「ポートは587」 |

### 技術的特徴

- **状態管理**: `.capture-state.json` で処理済み行を追跡（重複キャプチャ防止）
- **グレースフル**: Ollama未稼働・DB未初期化時は静かに終了
- **stdin上限**: 1MB（安全対策）
- **LanceDB直接参照**: MCPを経由せず直接 `@lancedb/lancedb` モジュールを使用

---

## MCP サーバー構成

`$HOME/.claude/settings.json` で定義されているMCPサーバー:

| サーバー | 用途 | 起動方式 |
|---------|------|---------|
| playwright | ブラウザ自動操作 | npx @playwright/mcp |
| sequential-thinking | 段階的思考 | npx MCPサーバー |
| filesystem | ファイルシステムアクセス | npx MCPサーバー |
| fetch | HTTP取得 | npx MCPサーバー |
| memory | セマンティックメモリ | bash スクリプト → tsx |
| mail | メール操作 | bash スクリプト |
| google-workspace | Google Drive/Gmail/Calendar | bash スクリプト (read-only) |

---

## 5. AssetFinanceApp - AI売買計画自動生成

**パス**: `$HOME/AssetFinanceApp/`

### 目的

毎朝7:00 JSTにAIで週間売買計画を生成しSlackに投稿する。

### アーキテクチャ

```
systemd timer (7:00) → run.sh (SOPS復号) → index.ts
  ├─ collectors/ (株価・ニュース・ポートフォリオ取得)
  ├─ prompt-builder.ts (プロンプト構築)
  ├─ research.ts (Claude Code CLI呼び出し)
  └─ slack.ts (Block Kit投稿、4000文字分割)
```

### 技術スタック

| 技術 | 用途 |
|------|------|
| Claude Code CLI (`claude -p`) | AI分析エンジン |
| yahoo-finance2 v3 | 株価取得 |
| rss-parser + cheerio | ニュース収集 |
| @slack/web-api | Slack投稿 (Block Kit) |

### デプロイ

- systemd timer: `asset-finance.timer` (毎朝7:00 JST)
- Slack: #all-claude-code-manager (C0AH8CMPEL8)
- テスト: 20/20通過
- 初回動作確認: 2026-03-07（93.3秒、Slack投稿成功）

---

## 6. iketomo_ch - YouTube定点観測・要約

**パス**: `$HOME/iketomo_ch/`

### 目的

YouTubeチャンネル「いけともチャンネル」の新着動画を毎日検出し、字幕をAIで要約する。

### アーキテクチャ

```
cron (6:00) → daily_observe.sh (yt-dlpで字幕取得)
cron (7:00) → auto_summarize.sh (Codex CLIで要約 → Slack通知)
```

### 技術スタック

| 技術 | 用途 |
|------|------|
| yt-dlp | 動画検出・字幕ダウンロード |
| jq | JSONメタデータ処理 |
| Codex CLI | AI要約 |
| Bash | スクリプト言語 |

### ディレクトリ構成

```
scripts/
├── daily_observe.sh        # 動画検出 + 字幕取得
├── auto_summarize.sh       # AI要約 (Codex CLI)
├── fetch_all_subtitles.sh  # 字幕一括取得
└── slack_notify.sh         # Slack通知 (SOPS復号)
subtitles/                  # VTT字幕
iketomo_text/               # テキスト変換済み字幕
summaries/                  # AI生成要約 (Markdown)
pending_summaries/          # 未処理キュー
```

### デプロイ

- cron: 6:00 (観測) / 7:00 (要約)
- 冪等設計（処理済み動画はスキップ）
- Codex CLI失敗時は次回自動リトライ

---

## 7. moneyforward - 資産スナップショット

**パス**: `$HOME/moneyforward/`

### 目的

MoneyForward MEから資産状態のスナップショットを取得し、差分を追跡する。

### 技術スタック

| 技術 | 用途 |
|------|------|
| Python 3 | 言語 |
| Playwright (Chromium) | ブラウザ自動操作 |
| pyotp | TOTP 2FA認証 |
| python-dotenv | 設定管理 |

### コマンド

```bash
python scripts/observe.py auth --visible    # 初回認証
python scripts/observe.py snapshot           # スナップショット取得
python scripts/observe.py diff               # 差分表示
```

### 注意事項

- ローカルPC推奨（VPSからのアクセスはIPブロックの可能性）
- credentials.env / session.json はコミット禁止

---

## 8. marp-slides - プレゼン自動生成

**パス**: `/opt/marp-slides/`

### 目的

CSIRTマネージャー向けのプレゼン資料をMarpで自動生成する。

### デザインシステム

| 要素 | 仕様 |
|------|------|
| カラー | グレースケール基調 + Navy(#1B4565) + Teal(#3E9BA4) |
| タイポグラフィ | タイトルにコロン・感嘆符禁止、1スライド1メッセージ |
| レイアウト | 最大5箇条書き、超過時は2カラム化 |

### コマンド

```bash
npm run build     # HTML出力
npm run pdf       # PDF出力
npm run preview   # プレビュー
```

### Claude Codeスキル連携

- `/marp <topic>` → スライド生成
- `slide-style-rector` → 自動スタイリング
- `layout-fix` → レイアウト検証
- `svg-creator` → 図表生成
- パターン集: `slides/example.md` (35パターン)

---

## 横断的な技術方針

### コーディング規約
- TypeScript ES2022+ strict mode
- Vitest でテスト
- 関数50行以内 / `any`禁止
- camelCase (変数) / PascalCase (型) / kebab-case (ファイル)

### シークレット管理
- SOPS + age暗号化 (`.env.enc`)
- 平文 `.env` は実行時のみ一時生成、終了時に自動削除
- age鍵: `$HOME/.config/sops/age/keys.txt`

### Git
- コミットメッセージは日本語
- force push禁止（hooks.jsonでブロック）
- 機密情報のコミット禁止

### エラーハンドリング
- 外部サービス障害時はグレースフルに継続（Slack投稿失敗でもカレンダー登録は試行）
- Ollama/LanceDB未稼働時はフックが静かに終了
