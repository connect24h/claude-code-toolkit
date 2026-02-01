# Codex CLI & Gemini CLI セットアップガイド

Claude Codeのオーケストレーション機能を使用するには、Codex CLIとGemini CLIのセットアップが必要です。

---

## 1. Codex CLI (OpenAI)

### インストール

```bash
# npmでグローバルインストール
npm install -g @openai/codex
```

### 認証

```bash
# 対話形式でログイン
codex login
```

ブラウザが開き、OpenAIアカウントで認証します。

### 動作確認

```bash
codex --version
# codex-cli 0.91.0

codex "Hello, world!"
```

### 主要コマンド

| コマンド | 説明 |
|----------|------|
| `codex "プロンプト"` | 対話モードで開始 |
| `codex exec "プロンプト"` | 非対話モード（自動実行） |
| `codex review` | コードレビューを実行 |
| `codex apply` | 最新の差分をgit applyで適用 |
| `codex resume` | 前回セッションを再開 |
| `codex resume --last` | 最新セッションを再開 |

### 使用例

```bash
# バグ修正を依頼
codex exec "src/utils.ts の未使用変数を削除してください"

# コードレビュー
codex review

# 差分を適用
codex apply
```

### サンドボックスモード

```bash
# サンドボックス内でコマンド実行
codex sandbox
```

---

## 2. Gemini CLI (Google)

### インストール

```bash
# npmでグローバルインストール
npm install -g @google/gemini-cli
```

### 認証

```bash
# 初回実行時に認証フローが開始
gemini

# または明示的にログイン
gemini login
```

ブラウザが開き、Googleアカウントで認証します。

### 動作確認

```bash
gemini --version
# 0.25.2

gemini "Hello, world!"
```

### 主要コマンド

| コマンド | 説明 |
|----------|------|
| `gemini "プロンプト"` | 対話モードで開始 |
| `gemini "プロンプト" -y` | YOLOモード（自動承認） |
| `gemini --approval-mode yolo "プロンプト"` | 全ツール自動承認 |
| `gemini --resume latest` | 最新セッションを再開 |
| `gemini --list-sessions` | セッション一覧表示 |

### 使用例

```bash
# 分析を依頼（対話モード）
gemini "このコードベースの構造を分析してください"

# 自動実行モード
gemini "README.mdを日本語に翻訳してください" --approval-mode yolo

# セッション再開
gemini --resume latest
```

### サンドボックスモード

```bash
# サンドボックス内で実行
gemini --sandbox "コードを生成してください"
```

---

## 3. Claude Code との連携

### オーケストレーション構成

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code                          │
│              （統括エージェント/オーケストレーター）      │
└───────────┬─────────────────────────────────────────────┘
            │
      ┌─────┴─────┐
      ▼           ▼
┌───────────┐ ┌───────────────┐
│ Codex CLI │ │  Gemini CLI   │
│ (OpenAI)  │ │   (Google)    │
└───────────┘ └───────────────┘
```

### タスク振り分け基準

| 複雑度 | 担当 | タスク例 |
|--------|------|----------|
| 低 | Codex CLI | バグ修正、1-2ファイル変更、hotfix |
| 中 | Gemini CLI | 分析、調査、ドキュメント生成、大量ファイル読解 |
| 高 | Claude Code | 新機能、リファクタ、マルチステップ、複雑なタスク |

### Claude Codeからの呼び出し

```bash
# 自動振り分け
/orchestrate <タスク>

# Codex CLIに直接委譲
/delegate-codex <タスク>

# Gemini CLIに直接委譲
/delegate-gemini <タスク>
```

---

## 4. 各CLIの特徴比較

| 特徴 | Codex CLI | Gemini CLI |
|------|-----------|------------|
| **提供元** | OpenAI | Google |
| **パッケージ** | @openai/codex | @google/gemini-cli |
| **認証** | OpenAIアカウント | Googleアカウント |
| **得意分野** | コード修正、レビュー | 分析、大規模読解 |
| **コンテキスト** | 標準 | 200万トークン（大） |
| **非対話モード** | `exec` | `-y` / `--approval-mode yolo` |
| **MCP対応** | ✅ | ✅ |

---

## 5. トラブルシューティング

### Codex CLI が動かない

```bash
# インストール確認
which codex
codex --version

# 再ログイン
codex logout
codex login

# 再インストール
npm uninstall -g @openai/codex
npm install -g @openai/codex
```

### Gemini CLI が動かない

```bash
# インストール確認
which gemini
gemini --version

# 再ログイン
gemini logout
gemini login

# 再インストール
npm uninstall -g @google/gemini-cli
npm install -g @google/gemini-cli
```

### 権限エラー

```bash
# npm グローバルインストールの権限問題
sudo npm install -g @openai/codex
sudo npm install -g @google/gemini-cli

# または npx で直接実行
npx @openai/codex "プロンプト"
npx @google/gemini-cli "プロンプト"
```

---

## 6. 推奨設定

### シェル設定（~/.bashrc または ~/.zshrc）

```bash
# エイリアス設定（オプション）
alias cx='codex'
alias gm='gemini'

# Codex 自動実行
alias cxe='codex exec'

# Gemini YOLOモード
alias gmy='gemini --approval-mode yolo'
```

設定後:
```bash
source ~/.bashrc
```

---

## 7. バージョン情報

このドキュメント作成時のバージョン:
- Codex CLI: 0.91.0
- Gemini CLI: 0.25.2

最新版の確認:
```bash
npm show @openai/codex version
npm show @google/gemini-cli version
```

アップデート:
```bash
npm update -g @openai/codex
npm update -g @google/gemini-cli
```
