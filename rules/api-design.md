---
name: api-design
description: REST API設計ルール
---

# API設計ルール

## エンドポイント設計

### 命名規則
- リソース名は複数形（`/users`, `/orders`）
- ケバブケース（`/user-profiles`）
- 動詞ではなく名詞を使用

```
✅ GET  /users
✅ GET  /users/123
✅ POST /users
✅ GET  /users/123/orders

❌ GET  /getUsers
❌ GET  /user/123
❌ POST /createUser
```

### HTTPメソッド

| メソッド | 用途 | 冪等性 |
|----------|------|--------|
| GET | リソース取得 | ✅ |
| POST | リソース作成 | ❌ |
| PUT | リソース全体更新 | ✅ |
| PATCH | リソース部分更新 | ❌ |
| DELETE | リソース削除 | ✅ |

---

## ステータスコード

### 成功

| コード | 用途 |
|--------|------|
| 200 | 成功（データあり） |
| 201 | 作成成功 |
| 204 | 成功（データなし） |

### クライアントエラー

| コード | 用途 |
|--------|------|
| 400 | リクエスト不正 |
| 401 | 認証必要 |
| 403 | アクセス禁止 |
| 404 | リソースなし |
| 409 | 競合（重複など） |
| 422 | バリデーションエラー |
| 429 | レート制限超過 |

### サーバーエラー

| コード | 用途 |
|--------|------|
| 500 | 内部エラー |
| 502 | ゲートウェイエラー |
| 503 | サービス利用不可 |

---

## レスポンス形式

### 成功レスポンス

```json
{
  "data": {
    "id": "123",
    "name": "John"
  }
}
```

### リスト

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasNext": true
  }
}
```

### エラーレスポンス

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email"
      }
    ]
  }
}
```

---

## ページネーション

### クエリパラメータ

```
GET /users?page=1&limit=20
GET /users?cursor=abc123&limit=20
```

### レスポンスヘッダー

```
X-Total-Count: 100
Link: </users?page=2>; rel="next"
```

---

## フィルタリング・ソート

```
# フィルタ
GET /users?status=active&role=admin

# ソート
GET /users?sort=createdAt:desc

# 検索
GET /users?q=john

# フィールド選択
GET /users?fields=id,name,email
```

---

## バージョニング

### URL方式（推奨）
```
GET /v1/users
GET /v2/users
```

### ヘッダー方式
```
GET /users
Accept: application/vnd.api.v1+json
```

---

## セキュリティヘッダー

```typescript
// 必須ヘッダー
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  next()
})
```

---

## レート制限

```typescript
// ヘッダーで制限情報を返す
res.setHeader('X-RateLimit-Limit', '100')
res.setHeader('X-RateLimit-Remaining', '95')
res.setHeader('X-RateLimit-Reset', '1640000000')
```

---

## 禁止事項

- 認証情報をURLに含める
- 機密データをGETパラメータに含める
- HTTPメソッドを無視した設計
- バージョンなしでの破壊的変更
