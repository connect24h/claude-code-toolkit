# vibe-kanban ワークフロー設計

everything-claude-code の考え方を取り入れた vibe-kanban からの指示動作設計

---

## 概要

vibe-kanban はカンバンボードでタスクを管理し、**Claude Code を統括エージェント**として使用します。
Claude Codeは必要に応じて **Codex CLI** と **Gemini CLI** にタスクを委譲します。

```
┌─────────────────────────────────────────────────────────┐
│                     vibe-kanban                         │
│                   （タスク管理）                         │
└─────────────────────────┬───────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    Claude Code                          │
│              （統括エージェント/オーケストレーター）      │
├─────────────────────────────────────────────────────────┤
│  • 複雑なタスクを自身で処理                              │
│  • 単純なタスクをCodex CLIに委譲                         │
│  • 分析タスクをGemini CLIに委譲                          │
└───────────┬─────────────────────────────┬───────────────┘
            ↓                             ↓
┌───────────────────────┐     ┌───────────────────────────┐
│      Codex CLI        │     │       Gemini CLI          │
│  （単純タスク実行）    │     │    （分析/ドキュメント）   │
├───────────────────────┤     ├───────────────────────────┤
│ • バグ修正            │     │ • コードベース分析         │
│ • 小規模変更          │     │ • ドキュメント生成         │
│ • コードレビュー      │     │ • 大規模読解              │
│ • hotfix             │     │ • 画像/UI分析             │
└───────────────────────┘     └───────────────────────────┘
```

---

## 1. オーケストレーション

### 1.1 タスク振り分け基準

| 複雑度 | 担当CLI | タスク例 |
|--------|---------|----------|
| **低** | Codex CLI | バグ修正、hotfix、1-2ファイル変更 |
| **中** | Gemini CLI | 分析、調査、ドキュメント生成 |
| **高** | Claude Code | 新機能、リファクタ、マルチステップ |

### 1.2 オーケストレーションコマンド

```markdown
# vibe-kanban タスク例

## タスク: 複数の作業を並列実行

/orchestrate 以下を最適なCLIで実行:
1. src/utils.ts のバグ修正 → Codex CLI
2. プロジェクト構造の分析 → Gemini CLI
3. 認証機能のTDD実装 → Claude Code
```

### 1.3 直接委譲コマンド

```markdown
# Codex CLIに直接委譲
/delegate-codex console.logを全て削除

# Gemini CLIに直接委譲
/delegate-gemini API仕様書を生成
```

---

## 2. エージェント（Agents）

### 2.1 orchestrator（オーケストレーター）

**用途**: タスクを分析し、最適なCLIに振り分け

```markdown
# タスク: 複数の作業を効率的に実行

## 使用エージェント: orchestrator

1. タスクを分析
2. 複雑度を判定
3. 適切なCLIに振り分け
4. 結果を統合
```

### 2.2 codex-delegate

**用途**: Codex CLIへのタスク委譲

```bash
# 実行コマンド
codex exec "タスクの説明"
codex review
```

### 2.3 gemini-delegate

**用途**: Gemini CLIへのタスク委譲

```bash
# 実行コマンド
gemini "タスクの説明"
gemini "分析タスク" --approval-mode yolo
```

### 2.4 planner（プランナー）

**用途**: 新機能の実装計画を立てる

```markdown
# タスク: [機能名] の実装

## 使用エージェント: planner

1. 要件を明確化
2. 影響範囲を分析
3. 実装ステップを分解
4. リスクを評価
5. **ユーザー確認を待つ**（コードを書かない）
```

### 2.5 tdd-guide（TDDガイド）

**用途**: テスト駆動開発で実装する

```markdown
# タスク: [機能名] のTDD実装

## 使用エージェント: tdd-guide

1. インターフェースを定義（SCAFFOLD）
2. 失敗するテストを書く（RED）
3. テストが失敗することを確認
4. 最小限のコードで実装（GREEN）
5. リファクタリング（REFACTOR）
6. カバレッジ80%以上を確認
```

### 2.6 code-reviewer

**用途**: 実装後のコードレビュー

### 2.7 security-reviewer

**用途**: セキュリティ観点でのレビュー

### 2.8 build-error-resolver

**用途**: ビルドエラーの解決

### 2.9 doc-updater

**用途**: ドキュメントの更新

---

## 3. コマンド（Commands）

| コマンド | 説明 | 担当 |
|----------|------|------|
| `/orchestrate` | タスクを分析し最適なCLIに振り分け | orchestrator |
| `/delegate-codex` | Codex CLIに直接委譲 | codex-delegate |
| `/delegate-gemini` | Gemini CLIに直接委譲 | gemini-delegate |
| `/plan` | 実装計画を作成 | planner |
| `/tdd` | TDDで実装 | tdd-guide |
| `/code-review` | コードレビュー | code-reviewer |
| `/verify` | 検証ループ実行 | verification-loop |
| `/build-fix` | ビルドエラー解決 | build-error-resolver |
| `/evolve` | パターンを進化 | continuous-learning |

---

## 4. vibe-kanban タスク記述テンプレート

### 4.1 オーケストレーション（複数CLI活用）

```markdown
# タスク: プロジェクト改善

## 説明
複数の改善を並列で実行

## ワークフロー
/orchestrate 以下を実行:
1. src/utils.ts のリファクタ（小規模）
2. テストカバレッジの分析
3. READMEの更新

## 期待する振り分け
- リファクタ → Codex CLI
- 分析 → Gemini CLI
- README → Gemini CLI
```

### 4.2 新機能実装（Claude Code）

```markdown
# タスク: [機能名]

## 説明
[機能の詳細説明]

## ワークフロー
1. /plan で実装計画を作成
2. 計画を確認後、/tdd で実装
3. /verify で検証
4. /code-review でレビュー

## 完了条件
- [ ] テストカバレッジ 80%+
- [ ] 型チェック通過
- [ ] コードレビュー完了
```

### 4.3 バグ修正（Codex CLI委譲）

```markdown
# タスク: [バグの説明]

## 説明
[バグの再現手順と期待される動作]

## ワークフロー
/delegate-codex [バグの説明と修正指示]

## 完了条件
- [ ] バグ修正完了
- [ ] 回帰テスト追加
```

### 4.4 分析タスク（Gemini CLI委譲）

```markdown
# タスク: コードベース分析

## 説明
プロジェクトの構造と依存関係を分析

## ワークフロー
/delegate-gemini プロジェクト全体の構造を分析し、
アーキテクチャ図と改善提案を生成

## 完了条件
- [ ] 分析レポート完成
- [ ] 改善提案リスト
```

---

## 5. 設定ファイル構成

```
~/.claude/
├── CLAUDE.md                    # グローバル設定
├── VIBE-KANBAN-WORKFLOW.md      # 本ドキュメント
├── agents/                      # エージェント定義
│   ├── orchestrator.md          # オーケストレーター
│   ├── codex-delegate.md        # Codex CLI委譲
│   ├── gemini-delegate.md       # Gemini CLI委譲
│   ├── planner.md
│   ├── tdd-guide.md
│   ├── code-reviewer.md
│   ├── security-reviewer.md
│   ├── build-error-resolver.md
│   └── doc-updater.md
├── commands/                    # コマンド定義
│   ├── orchestrate.md           # /orchestrate
│   ├── delegate-codex.md        # /delegate-codex
│   ├── delegate-gemini.md       # /delegate-gemini
│   ├── plan.md
│   ├── tdd.md
│   ├── code-review.md
│   ├── verify.md
│   ├── build-fix.md
│   └── evolve.md
├── skills/
├── rules/
├── hooks/
└── homunculus/

~/.codex/skills/                 # Codex CLIスキル
├── tdd-workflow/
├── verification-loop/
└── security-review/

~/GEMINI.md                      # Gemini CLI設定
```

---

## 6. 実行例

### 例1: 単純なバグ修正

```
vibe-kanban タスク:
  "src/utils.ts の null チェック漏れを修正"

Claude Code:
  → 複雑度: 低
  → Codex CLI に委譲

Codex CLI:
  codex exec "src/utils.ts の null チェック漏れを修正"
  → 修正完了

Claude Code:
  → 結果を確認
  → タスク完了を報告
```

### 例2: 大規模分析

```
vibe-kanban タスク:
  "プロジェクト全体のアーキテクチャを分析"

Claude Code:
  → 複雑度: 中（分析タスク）
  → Gemini CLI に委譲

Gemini CLI:
  gemini "プロジェクト全体のアーキテクチャを分析し、
         構造図と改善提案を生成"
  → 分析レポート生成

Claude Code:
  → 結果を収集
  → レポートを整形して報告
```

### 例3: 複雑な新機能

```
vibe-kanban タスク:
  "ユーザー認証機能をTDDで実装"

Claude Code:
  → 複雑度: 高
  → 自身で処理

  1. /plan で計画作成
  2. ユーザー確認
  3. /tdd で実装
  4. /verify で検証
  5. /code-review でレビュー
  → タスク完了
```

---

## 参考

- [everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- Claude Code 公式ドキュメント
- Codex CLI ドキュメント
- Gemini CLI ドキュメント
