---
name: security
description: セキュリティルール
---

# セキュリティルール

## 入力検証

- すべてのユーザー入力を検証
- ホワイトリスト方式を優先
- サーバーサイドで必ず検証

## SQLインジェクション対策

```typescript
// ❌ 危険
db.query(`SELECT * FROM users WHERE id = ${userId}`)

// ✅ 安全
db.query('SELECT * FROM users WHERE id = ?', [userId])
```

## XSS対策

```typescript
// ❌ 危険
element.innerHTML = userInput

// ✅ 安全
element.textContent = userInput
```

## 認証・認可

- 全てのエンドポイントで認証確認
- 最小権限の原則
- セッションの適切な管理

## 機密情報

- ハードコード禁止
- 環境変数を使用
- ログに出力しない
- `.env` をコミットしない

## 依存関係

- 定期的にアップデート
- 既知の脆弱性をチェック
- 最小限の依存関係
