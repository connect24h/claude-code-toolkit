# ルール一覧

常に適用されるルールの一覧

---

## coding-style
**コーディングスタイル**

### 命名規則
- 変数/関数: camelCase
- クラス/型: PascalCase
- 定数: UPPER_SNAKE_CASE
- ファイル: kebab-case

### 関数
- 長さ: 50行以内
- 引数: 4つ以内
- ネスト: 4レベル以内

### 禁止
- `any`型
- `console.log`残留
- ハードコード機密情報
- 未使用import/変数

---

## git-workflow
**Gitワークフロー**

### ブランチ
- `main`: 本番
- `develop`: 開発
- `feature/*`: 機能
- `bugfix/*`: バグ修正

### コミットメッセージ
```
<type>(<scope>): <subject>
```
- feat, fix, docs, style, refactor, test, chore

### 禁止
- mainへの直接プッシュ
- force push
- 機密情報のコミット

---

## security
**セキュリティ**

### 入力検証
- すべてのユーザー入力を検証
- ホワイトリスト方式

### SQLインジェクション対策
```typescript
// ✅ パラメータ化クエリ
db.query('SELECT * FROM users WHERE id = ?', [userId])
```

### XSS対策
```typescript
// ✅ textContent使用
element.textContent = userInput
```

---

## testing
**テスト**

### カバレッジ
- 80%以上: 通常コード
- 100%: 重要コード（認証、金融計算）

### テストの書き方
- AAA: Arrange-Act-Assert
- エッジケースをカバー
- 実装詳細ではなく振る舞いをテスト

---

## ルールファイル一覧

```
~/.claude/rules/
├── coding-style.md
├── git-workflow.md
├── security.md
└── testing.md
```
