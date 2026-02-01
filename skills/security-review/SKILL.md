---
name: security-review
description: セキュリティレビュー。OWASP Top 10を中心にチェック。
trigger: "API", "認証", "DB", "ユーザー入力"
---

# Security Review スキル

セキュリティ観点でのコードレビューを自動的に適用します。

## トリガー

以下のキーワードが含まれる場合に自動適用:
- API
- 認証
- データベース
- ユーザー入力
- パスワード
- トークン

## OWASP Top 10 チェック

### A01: アクセス制御
- [ ] 認証チェックあり
- [ ] 認可チェックあり
- [ ] IDOR対策あり

### A02: 暗号化
- [ ] 機密情報は暗号化
- [ ] 強い暗号アルゴリズム
- [ ] 鍵管理は適切

### A03: インジェクション
- [ ] パラメータ化クエリ
- [ ] 入力検証
- [ ] 出力エスケープ

### A07: 認証
- [ ] ブルートフォース対策
- [ ] セッション管理
- [ ] パスワードポリシー

## 危険なパターン

```javascript
// ❌ SQLインジェクション
`SELECT * FROM users WHERE id = ${userId}`

// ❌ XSS
element.innerHTML = userInput

// ❌ コマンドインジェクション
exec(`ls ${userInput}`)

// ❌ 機密情報ログ
console.log(password)
```

## 安全なパターン

```javascript
// ✅ パラメータ化
db.query('SELECT * FROM users WHERE id = ?', [userId])

// ✅ テキストコンテンツ
element.textContent = userInput

// ✅ 入力検証
if (!isValidId(userInput)) throw new Error()

// ✅ マスキング
console.log('password: [REDACTED]')
```

## 関連エージェント

- `security-reviewer`: セキュリティレビュー専門家

## 関連コマンド

- `/security-review`: セキュリティレビューを明示的に開始
