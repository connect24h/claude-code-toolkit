# エージェント一覧

Claude Codeで使用可能なエージェントの一覧

---

## オーケストレーション

### orchestrator
**タスク振り分けエージェント**

タスクを分析し、複雑度に応じて最適なCLIに振り分けます。

| 複雑度 | 振り分け先 |
|--------|------------|
| 低 | Codex CLI |
| 中 | Gemini CLI |
| 高 | Claude Code |

```
/orchestrate [タスクの説明]
```

---

### codex-delegate
**Codex CLI委譲エージェント**

単純なタスクをCodex CLIに委譲します。

**得意分野:**
- バグ修正
- 小規模変更（1-2ファイル）
- コードレビュー
- hotfix

```
/delegate-codex [タスクの説明]
```

---

### gemini-delegate
**Gemini CLI委譲エージェント**

分析・調査タスクをGemini CLIに委譲します。

**得意分野:**
- 大規模コードベース分析
- ドキュメント生成
- 画像/UI関連
- 調査・リサーチ

```
/delegate-gemini [タスクの説明]
```

---

## 計画・設計

### planner
**計画立案エージェント**

新機能の実装計画を作成します。**コードは書かず、ユーザー確認を待ちます。**

```
/plan [機能の説明]
```

---

## 実装

### tdd-guide
**TDD実装エージェント**

テスト駆動開発で実装します。

**TDDサイクル:** RED → GREEN → REFACTOR → REPEAT

```
/tdd [機能の説明]
```

---

### build-error-resolver
**ビルドエラー解決エージェント**

ビルドエラーを分析し、修正します。

```
/build-fix
```

---

## レビュー

### code-reviewer
**コードレビューエージェント**

コード品質を包括的にレビューします。

```
/code-review [対象ファイル]
```

---

### security-reviewer
**セキュリティレビューエージェント**

OWASP Top 10を中心にセキュリティをレビューします。

---

## ドキュメント

### doc-updater
**ドキュメント更新エージェント**

コード変更に伴うドキュメントを更新します。

---

## エージェントファイル一覧

```
~/.claude/agents/
├── orchestrator.md
├── codex-delegate.md
├── gemini-delegate.md
├── planner.md
├── tdd-guide.md
├── code-reviewer.md
├── security-reviewer.md
├── build-error-resolver.md
└── doc-updater.md
```
