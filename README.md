# Claude Code Toolkit

Claude Code (Everything You Need to Know) の設定・スキル・エージェント集

## 概要

このリポジトリは、Claude Codeの拡張設定をまとめたものです。以下の機能が含まれています：

- **Agents**: 専門化されたサブエージェント（TDD、コードレビュー、オーケストレーター等）
- **Commands**: スラッシュコマンド（/plan, /tdd, /verify 等）
- **Skills**: 再利用可能なスキル定義
- **Rules**: コーディング規約・セキュリティルール
- **Hooks**: 自動化フック

## ディレクトリ構成

```
claude-code-toolkit/
├── agents/           # サブエージェント定義
│   ├── orchestrator.md
│   ├── codex-delegate.md
│   ├── gemini-delegate.md
│   ├── planner.md
│   ├── tdd-guide.md
│   ├── code-reviewer.md
│   ├── security-reviewer.md
│   ├── build-error-resolver.md
│   └── doc-updater.md
├── commands/         # スラッシュコマンド
│   ├── orchestrate.md
│   ├── delegate-codex.md
│   ├── delegate-gemini.md
│   ├── plan.md
│   ├── tdd.md
│   ├── verify.md
│   ├── code-review.md
│   ├── build-fix.md
│   └── evolve.md
├── skills/           # スキル定義
│   ├── continuous-learning/
│   ├── security-review/
│   ├── tdd-workflow/
│   ├── verification-loop/
│   └── youtube-channel-observer.md
├── rules/            # ルール定義
│   ├── coding-style.md
│   ├── git-workflow.md
│   ├── security.md
│   └── testing.md
├── hooks/            # フック設定
│   └── hooks.json
├── docs/             # ドキュメント
│   ├── CLAUDE.md
│   ├── VIBE-KANBAN-WORKFLOW.md
│   └── ...
└── examples/         # 使用例
    └── youtube-observer/
```

## インストール方法

### 方法1: 自動インストール

```bash
# リポジトリをクローン
git clone https://github.com/connect24h/claude-code-toolkit.git

# インストールスクリプトを実行
cd claude-code-toolkit
./install.sh
```

### 方法2: 手動インストール

```bash
# 各ディレクトリを ~/.claude/ にコピー
cp -r agents/* ~/.claude/agents/
cp -r commands/* ~/.claude/commands/
cp -r skills/* ~/.claude/skills/
cp -r rules/* ~/.claude/rules/
cp hooks/hooks.json ~/.claude/hooks/
```

## 主要機能

### オーケストレーション

Claude CodeがCodex CLI、Gemini CLIにタスクを振り分けます。

```
/orchestrate <タスク>
```

| 複雑度 | 担当 | タスク例 |
|--------|------|----------|
| 低 | Codex CLI | バグ修正、1-2ファイル変更 |
| 中 | Gemini CLI | 分析、調査、ドキュメント生成 |
| 高 | Claude Code | 新機能、リファクタ |

### TDD（テスト駆動開発）

```
/tdd <機能名>
```

RED → GREEN → REFACTOR サイクルで実装

### コードレビュー

```
/code-review [ファイルパス]
```

品質、セキュリティ、パフォーマンス、保守性を評価

### 検証ループ

```
/verify
```

型チェック、リント、テスト、ビルドを一括実行

## YouTube定点観測（例）

YouTubeチャンネルを毎日自動で観測し、要約を作成する例が含まれています。

```bash
# 設定ファイル
examples/youtube-observer/channels.json

# スクリプト
examples/youtube-observer/scripts/daily_observe.sh
examples/youtube-observer/scripts/auto_summarize.sh
```

## 前提条件

- Claude Code CLI
- Codex CLI（オーケストレーション用）- [セットアップガイド](docs/CODEX-GEMINI-SETUP.md)
- Gemini CLI（オーケストレーション用）- [セットアップガイド](docs/CODEX-GEMINI-SETUP.md)
- yt-dlp（YouTube観測用）
- jq

### APIキー取得先

| CLI | 取得先 |
|-----|--------|
| Claude Code | https://console.anthropic.com/settings/keys |
| Codex CLI | https://platform.openai.com/api-keys |
| Gemini CLI | https://aistudio.google.com/apikey |

## ライセンス

MIT License

## 貢献

Issue、Pull Requestを歓迎します。
