---
name: owasp-top10
description: OWASP Top 10 セキュリティルール（2021年版ベース）
---

# OWASP Top 10 セキュリティルール

## A01: アクセス制御の不備 (Broken Access Control)

### 必須対策
- 全エンドポイントで認可チェック
- デフォルトは拒否（deny by default）
- リソースへのアクセスはユーザー所有権を確認

### コード例

```typescript
// ❌ 危険: ユーザーIDのみでアクセス
app.get('/api/users/:id', (req, res) => {
  return db.getUser(req.params.id)
})

// ✅ 安全: 所有権確認
app.get('/api/users/:id', authenticate, (req, res) => {
  if (req.user.id !== req.params.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  return db.getUser(req.params.id)
})
```

### チェックリスト
- [ ] CORS設定は最小限に
- [ ] JWT/セッショントークンは適切に検証
- [ ] IDORの脆弱性がないか確認
- [ ] 管理者機能へのアクセス制限

---

## A02: 暗号化の失敗 (Cryptographic Failures)

### 必須対策
- 機密データは暗号化して保存
- TLS 1.2以上を使用
- 強力なハッシュアルゴリズム使用

### コード例

```typescript
// ❌ 危険: MD5/SHA1でパスワードハッシュ
const hash = crypto.createHash('md5').update(password).digest('hex')

// ✅ 安全: bcryptを使用
import bcrypt from 'bcrypt'
const hash = await bcrypt.hash(password, 12)
```

### 禁止事項
- MD5, SHA1をパスワードに使用
- ハードコードされた暗号化キー
- 自作の暗号化アルゴリズム

---

## A03: インジェクション (Injection)

### 必須対策
- パラメータ化クエリを使用
- ORM/クエリビルダーを使用
- 入力値のエスケープ

### SQLインジェクション

```typescript
// ❌ 危険
const query = `SELECT * FROM users WHERE email = '${email}'`

// ✅ 安全: パラメータ化クエリ
const query = 'SELECT * FROM users WHERE email = ?'
db.query(query, [email])

// ✅ 安全: ORM使用
User.findOne({ where: { email } })
```

### コマンドインジェクション

```typescript
// ❌ 危険
exec(`ping ${userInput}`)

// ✅ 安全: 入力検証 + エスケープ
import { execFile } from 'child_process'
if (!/^[\w.-]+$/.test(host)) throw new Error('Invalid host')
execFile('ping', ['-c', '4', host])
```

### NoSQLインジェクション

```typescript
// ❌ 危険
db.users.find({ username: req.body.username })

// ✅ 安全: 型チェック
if (typeof req.body.username !== 'string') throw new Error('Invalid')
db.users.find({ username: req.body.username })
```

---

## A04: 安全でない設計 (Insecure Design)

### 必須対策
- 脅威モデリングを実施
- セキュリティ要件を設計段階で定義
- ビジネスロジックのセキュリティテスト

### 設計原則
- 最小権限の原則
- 多層防御（Defense in Depth）
- フェイルセキュア

### チェックリスト
- [ ] レート制限を実装
- [ ] ビジネスロジックの悪用を防止
- [ ] リソース消費の制限

---

## A05: セキュリティ設定ミス (Security Misconfiguration)

### 必須対策
- 本番環境でデバッグモード無効
- デフォルトの認証情報を変更
- 不要な機能を無効化

### コード例

```typescript
// ❌ 危険: 詳細なエラー情報を公開
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.stack })
})

// ✅ 安全: 本番では汎用エラー
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})
```

### 環境設定
```typescript
// 本番環境チェック
if (process.env.NODE_ENV === 'production') {
  app.disable('x-powered-by')
  app.use(helmet())
}
```

---

## A06: 脆弱なコンポーネント (Vulnerable Components)

### 必須対策
- 依存関係の定期的な監査
- セキュリティアップデートの適用
- 使用していない依存関係の削除

### コマンド

```bash
# npm
npm audit
npm audit fix

# yarn
yarn audit

# Snyk
npx snyk test
```

### CI/CD設定
```yaml
# GitHub Actions
- name: Security Audit
  run: npm audit --audit-level=high
```

---

## A07: 認証の不備 (Identification and Authentication Failures)

### 必須対策
- 強力なパスワードポリシー
- 多要素認証（MFA）の実装
- ブルートフォース対策

### コード例

```typescript
// パスワードポリシー
const passwordPolicy = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
}

// レート制限
import rateLimit from 'express-rate-limit'
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
})
app.post('/login', loginLimiter, loginHandler)
```

### セッション管理
- セッションIDは認証後に再生成
- セッションタイムアウトを設定
- ログアウト時にセッションを破棄

---

## A08: ソフトウェアとデータの整合性 (Software and Data Integrity Failures)

### 必須対策
- 依存関係の署名検証
- CI/CDパイプラインのセキュリティ
- デシリアライズの安全性

### コード例

```typescript
// ❌ 危険: 任意のオブジェクトをデシリアライズ
const data = JSON.parse(userInput)
eval(data.code)

// ✅ 安全: スキーマ検証
import { z } from 'zod'
const schema = z.object({
  name: z.string(),
  age: z.number()
})
const data = schema.parse(JSON.parse(userInput))
```

---

## A09: ログとモニタリングの不備 (Security Logging and Monitoring Failures)

### 必須対策
- セキュリティイベントのログ記録
- ログの改ざん防止
- アラート設定

### ログすべきイベント
- 認証の成功/失敗
- アクセス制御の失敗
- 入力検証の失敗
- 例外とエラー

### コード例

```typescript
// セキュリティログ
const securityLogger = {
  authFailure: (userId: string, ip: string) => {
    logger.warn('AUTH_FAILURE', {
      userId,
      ip,
      timestamp: new Date().toISOString(),
      type: 'security'
    })
  }
}
```

### 禁止事項
- パスワードをログに出力
- クレジットカード番号をログに出力
- 個人情報をログに出力

---

## A10: SSRF (Server-Side Request Forgery)

### 必須対策
- URLのホワイトリスト検証
- 内部ネットワークへのアクセス制限
- リダイレクトの無効化

### コード例

```typescript
// ❌ 危険: ユーザー入力のURLにそのままリクエスト
const response = await fetch(userProvidedUrl)

// ✅ 安全: ホワイトリスト検証
const allowedHosts = ['api.example.com', 'cdn.example.com']
const url = new URL(userProvidedUrl)
if (!allowedHosts.includes(url.hostname)) {
  throw new Error('Host not allowed')
}
const response = await fetch(url.toString())
```

---

## クイックリファレンス

| 脆弱性 | 主な対策 |
|--------|----------|
| A01 アクセス制御 | 認可チェック、所有権確認 |
| A02 暗号化 | bcrypt、TLS 1.2+ |
| A03 インジェクション | パラメータ化クエリ、ORM |
| A04 安全でない設計 | 脅威モデリング、レート制限 |
| A05 設定ミス | デバッグ無効、helmet |
| A06 脆弱なコンポーネント | npm audit、定期更新 |
| A07 認証不備 | MFA、レート制限 |
| A08 整合性 | 署名検証、スキーマ検証 |
| A09 ログ不備 | セキュリティログ、アラート |
| A10 SSRF | URLホワイトリスト |
