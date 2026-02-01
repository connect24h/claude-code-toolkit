# Codex CLI & Gemini CLI セットアップガイド

Claude Codeのオーケストレーション機能を使用するには、Codex CLIとGemini CLIのセットアップが必要です。

---

## 1. Codex CLI (OpenAI)

### インストール

```bash
# npmでインストール
npm install -g @openai/codex

# または yarn
yarn global add @openai/codex
```

### 認証設定

```bash
# OpenAI APIキーを設定
export OPENAI_API_KEY="sk-..."

# または .bashrc / .zshrc に追加
echo 'export OPENAI_API_KEY="sk-..."' >> ~/.bashrc
source ~/.bashrc
```

### 動作確認

```bash
codex "Hello, world!"
```

### 主要コマンド

| コマンド | 説明 |
|----------|------|
| `codex "タスク"` | 対話モードでタスク実行 |
| `codex exec "タスク"` | 非対話モードで実行 |
| `codex review` | コードレビュー |
| `codex apply` | 差分を適用 |

### 設定ファイル

`~/.codex/config.json`:
```json
{
  "model": "gpt-4",
  "approval_mode": "suggest"
}
```

---

## 2. Gemini CLI (Google)

### インストール

```bash
# npmでインストール
npm install -g @anthropic-ai/gemini-cli

# または公式インストーラー
curl -fsSL https://gemini.google.com/cli/install.sh | bash
```

### 認証設定

```bash
# Google Cloud認証
gcloud auth application-default login

# または API キーを設定
export GEMINI_API_KEY="..."

# または .bashrc / .zshrc に追加
echo 'export GEMINI_API_KEY="..."' >> ~/.bashrc
source ~/.bashrc
```

### 動作確認

```bash
gemini "Hello, world!"
```

### 主要コマンド

| コマンド | 説明 |
|----------|------|
| `gemini "タスク"` | 対話モードでタスク実行 |
| `gemini "タスク" --approval-mode yolo` | 自動承認モード |
| `gemini --resume latest` | 前回セッション再開 |

### 設定ファイル

`~/.gemini/config.json`:
```json
{
  "model": "gemini-2.0-flash",
  "sandbox": true
}
```

---

## 3. Claude Code との連携

### オーケストレーション構成

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code                          │
│              （統括エージェント/オーケストレーター）      │
└───────────┬─────────────────────────────┬───────────────┘
            ↓                             ↓
┌───────────────────────┐     ┌───────────────────────────┐
│      Codex CLI        │     │       Gemini CLI          │
│  (単純タスク/修正)    │     │  (分析/調査/ドキュメント) │
└───────────────────────┘     └───────────────────────────┘
```

### タスク振り分け基準

| 複雑度 | 担当 | タスク例 |
|--------|------|----------|
| 低 | Codex CLI | バグ修正、1-2ファイル変更、hotfix |
| 中 | Gemini CLI | 分析、調査、ドキュメント生成 |
| 高 | Claude Code | 新機能、リファクタ、マルチステップ |

### 使用方法

```bash
# Claude Codeから直接コマンドで呼び出し
/orchestrate <タスク>      # 自動振り分け
/delegate-codex <タスク>   # Codex CLIに委譲
/delegate-gemini <タスク>  # Gemini CLIに委譲
```

---

## 4. トラブルシューティング

### Codex CLI が動かない

```bash
# インストール確認
which codex

# APIキー確認
echo $OPENAI_API_KEY

# 再インストール
npm uninstall -g @openai/codex && npm install -g @openai/codex
```

### Gemini CLI が動かない

```bash
# インストール確認
which gemini

# APIキー確認
echo $GEMINI_API_KEY

# 認証状態確認
gcloud auth application-default print-access-token
```

### タイムアウトエラー

```bash
# Codex: タイムアウト延長
codex exec --timeout 600 "タスク"

# Gemini: タイムアウト延長
gemini "タスク" --timeout 600
```

---

## 5. 必要なAPIキー取得先

| CLI | APIキー取得先 |
|-----|--------------|
| Codex CLI | https://platform.openai.com/api-keys |
| Gemini CLI | https://aistudio.google.com/apikey |
| Claude Code | https://console.anthropic.com/settings/keys |

---

## 6. 推奨環境変数設定

`~/.bashrc` または `~/.zshrc` に追加:

```bash
# Claude Code (Anthropic)
export ANTHROPIC_API_KEY="sk-ant-..."

# Codex CLI (OpenAI)
export OPENAI_API_KEY="sk-..."

# Gemini CLI (Google)
export GEMINI_API_KEY="..."
```

設定後:
```bash
source ~/.bashrc
```
