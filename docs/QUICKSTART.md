# クイックスタートガイド

Claude Code + Codex CLI + Gemini CLI オーケストレーションシステム

---

## 概要

```
┌─────────────────────────────────────────────────────────┐
│                     vibe-kanban                         │
│                   （タスク管理）                         │
└─────────────────────────┬───────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Claude Code                          │
│              （統括エージェント/オーケストレーター）      │
└───────────┬─────────────────────────────┬───────────────┘
            ↓                             ↓
┌───────────────────────┐     ┌───────────────────────────┐
│      Codex CLI        │     │       Gemini CLI          │
│  （単純タスク実行）    │     │    （分析/ドキュメント）   │
└───────────────────────┘     └───────────────────────────┘
```

---

## よく使うコマンド

### オーケストレーション
```
/orchestrate [タスクの説明]    # 最適なCLIに振り分け
/delegate-codex [タスク]       # Codex CLIに委譲
/delegate-gemini [タスク]      # Gemini CLIに委譲
```

### 開発ワークフロー
```
/plan [機能]                   # 実装計画を作成
/tdd [機能]                    # TDDで実装
/verify                        # 検証ループ実行
/code-review [ファイル]        # コードレビュー
/build-fix                     # ビルドエラー解決
```

---

## タスク振り分け基準

| 複雑度 | CLI | タスク例 |
|--------|-----|----------|
| 低 | Codex CLI | バグ修正、hotfix、1-2ファイル変更 |
| 中 | Gemini CLI | 分析、調査、ドキュメント生成 |
| 高 | Claude Code | 新機能、リファクタ、マルチステップ |

---

## 使用例

### 単純なバグ修正
```
/delegate-codex src/utils.ts の null チェック漏れを修正
```

### 大規模分析
```
/delegate-gemini プロジェクト全体のアーキテクチャを分析
```

### 新機能実装
```
/plan ユーザー認証機能を追加
# 計画確認後
/tdd 認証機能を実装
/verify
/code-review
```

### 複数タスクの並列実行
```
/orchestrate 以下を実行:
1. src/utils.ts のリファクタ
2. テストカバレッジの分析
3. READMEの更新
```

---

## TDDサイクル

```
RED → GREEN → REFACTOR → REPEAT

1. 失敗するテストを書く（RED）
2. テストを通す最小コード（GREEN）
3. リファクタリング（REFACTOR）
4. 繰り返し
```

---

## 検証ループ

```
型チェック → リント → テスト → ビルド
```

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

---

## ドキュメント一覧

| ファイル | 内容 |
|----------|------|
| CLAUDE.md | グローバル設定 |
| AGENTS.md | エージェント一覧 |
| COMMANDS.md | コマンド一覧 |
| SKILLS.md | スキル一覧 |
| RULES.md | ルール一覧 |
| VIBE-KANBAN-WORKFLOW.md | 詳細ワークフロー設計 |

---

## 設定ファイル構成

```
~/.claude/
├── CLAUDE.md
├── QUICKSTART.md (本ファイル)
├── AGENTS.md
├── COMMANDS.md
├── SKILLS.md
├── RULES.md
├── VIBE-KANBAN-WORKFLOW.md
├── agents/
├── commands/
├── skills/
├── rules/
├── hooks/
└── homunculus/
```
