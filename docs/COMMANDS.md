# コマンド一覧

Claude Codeで使用可能なスラッシュコマンドの一覧

---

## オーケストレーション

### /orchestrate
**タスク振り分け**

タスクを分析し、最適なCLI（Claude Code / Codex CLI / Gemini CLI）に振り分けます。

```
/orchestrate [タスクの説明]
```

**例:**
```
/orchestrate 以下を実行:
1. src/utils.ts のバグ修正
2. プロジェクト構造の分析
3. 認証機能のTDD実装
```

---

### /delegate-codex
**Codex CLIに委譲**

タスクをCodex CLIに直接委譲します。

```
/delegate-codex [タスクの説明]
```

**例:**
```
/delegate-codex console.logを全て削除
/delegate-codex このPRをレビュー
```

**適したタスク:**
- バグ修正
- 小規模変更
- コードレビュー
- hotfix

---

### /delegate-gemini
**Gemini CLIに委譲**

タスクをGemini CLIに直接委譲します。

```
/delegate-gemini [タスクの説明]
```

**例:**
```
/delegate-gemini プロジェクト全体の構造を分析
/delegate-gemini API仕様書を生成
```

**適したタスク:**
- 大規模分析
- ドキュメント生成
- 調査・リサーチ
- 画像/UI分析

---

## 計画・設計

### /plan
**実装計画を作成**

plannerエージェントを呼び出し、実装計画を作成します。
**コードは書かず、ユーザー確認を待ちます。**

```
/plan [機能の説明]
```

**例:**
```
/plan ユーザー認証機能を追加したい
```

---

## 実装

### /tdd
**TDDで実装**

tdd-guideエージェントを呼び出し、テスト駆動開発で実装します。

```
/tdd [機能の説明]
```

**TDDサイクル:**
```
RED → GREEN → REFACTOR → REPEAT
```

**例:**
```
/tdd ユーザーの年齢を計算する関数
```

---

### /build-fix
**ビルドエラー解決**

build-error-resolverエージェントを呼び出し、ビルドエラーを解決します。

```
/build-fix
```

---

## 検証・レビュー

### /verify
**検証ループ実行**

型チェック、リント、テスト、ビルドを順番に実行します。

```
/verify
```

**実行内容:**
```bash
npx tsc --noEmit  # 型チェック
npm run lint       # リント
npm test           # テスト
npm run build      # ビルド
```

---

### /code-review
**コードレビュー**

code-reviewerエージェントを呼び出し、コードをレビューします。

```
/code-review [対象ファイル/機能]
```

**例:**
```
/code-review src/services/auth.ts
/code-review 最近の変更
```

---

## 継続学習

### /evolve
**パターンを進化**

蓄積されたパターン（instincts）を分析し、コマンド/スキル/エージェントに昇格します。

```
/evolve              # 分析と提案
/evolve --execute    # 実際に作成
```

---

## コマンドファイル一覧

```
~/.claude/commands/
├── orchestrate.md      # /orchestrate
├── delegate-codex.md   # /delegate-codex
├── delegate-gemini.md  # /delegate-gemini
├── plan.md             # /plan
├── tdd.md              # /tdd
├── build-fix.md        # /build-fix
├── verify.md           # /verify
├── code-review.md      # /code-review
└── evolve.md           # /evolve
```

---

## クイックリファレンス

| コマンド | 説明 | エージェント |
|----------|------|--------------|
| `/orchestrate` | タスク振り分け | orchestrator |
| `/delegate-codex` | Codex CLI委譲 | codex-delegate |
| `/delegate-gemini` | Gemini CLI委譲 | gemini-delegate |
| `/plan` | 実装計画 | planner |
| `/tdd` | TDD実装 | tdd-guide |
| `/build-fix` | ビルドエラー解決 | build-error-resolver |
| `/verify` | 検証ループ | verification-loop |
| `/code-review` | コードレビュー | code-reviewer |
| `/evolve` | パターン進化 | continuous-learning |
