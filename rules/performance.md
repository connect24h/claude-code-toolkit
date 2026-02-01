---
name: performance
description: パフォーマンス最適化ルール
---

# パフォーマンスルール

## データベース

### N+1問題を回避

```typescript
// ❌ N+1クエリ
const users = await User.findAll()
for (const user of users) {
  user.posts = await Post.findAll({ where: { userId: user.id } })
}

// ✅ EagerLoading / JOIN
const users = await User.findAll({
  include: [{ model: Post }]
})
```

### インデックス

```sql
-- 検索条件に使用するカラムにインデックス
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at);
```

### ページネーション

```typescript
// ❌ 全件取得
const users = await User.findAll()

// ✅ ページネーション
const users = await User.findAll({
  limit: 20,
  offset: 0
})

// ✅ カーソルベース（大量データ向け）
const users = await User.findAll({
  where: { id: { [Op.gt]: lastId } },
  limit: 20,
  order: [['id', 'ASC']]
})
```

### 必要なカラムのみ取得

```typescript
// ❌ 全カラム
const user = await User.findById(id)

// ✅ 必要なカラムのみ
const user = await User.findById(id, {
  attributes: ['id', 'name', 'email']
})
```

---

## キャッシュ

### パターン

```typescript
async function getUser(id: string) {
  // キャッシュ確認
  const cached = await redis.get(`user:${id}`)
  if (cached) return JSON.parse(cached)

  // DBから取得
  const user = await db.users.findById(id)

  // キャッシュに保存（TTL: 1時間）
  await redis.setex(`user:${id}`, 3600, JSON.stringify(user))

  return user
}
```

### キャッシュ無効化

```typescript
// 更新時にキャッシュ削除
async function updateUser(id: string, data: object) {
  await db.users.update(id, data)
  await redis.del(`user:${id}`)
}
```

---

## 非同期処理

### 並列実行

```typescript
// ❌ 直列実行
const users = await getUsers()
const orders = await getOrders()
const products = await getProducts()

// ✅ 並列実行
const [users, orders, products] = await Promise.all([
  getUsers(),
  getOrders(),
  getProducts()
])
```

### バックグラウンド処理

```typescript
// ❌ レスポンスをブロック
app.post('/orders', async (req, res) => {
  const order = await createOrder(req.body)
  await sendEmail(order)  // 遅い
  await updateInventory(order)  // 遅い
  res.json(order)
})

// ✅ キューに投入
app.post('/orders', async (req, res) => {
  const order = await createOrder(req.body)
  await queue.add('sendEmail', { orderId: order.id })
  await queue.add('updateInventory', { orderId: order.id })
  res.json(order)
})
```

---

## メモリ

### ストリーミング

```typescript
// ❌ メモリに全データ
const data = fs.readFileSync('large-file.json')
res.json(JSON.parse(data))

// ✅ ストリーミング
const stream = fs.createReadStream('large-file.json')
stream.pipe(res)
```

### 大量データの処理

```typescript
// ❌ 全件メモリに展開
const allUsers = await User.findAll()
for (const user of allUsers) {
  process(user)
}

// ✅ バッチ処理
const batchSize = 100
let offset = 0
while (true) {
  const users = await User.findAll({ limit: batchSize, offset })
  if (users.length === 0) break
  for (const user of users) {
    process(user)
  }
  offset += batchSize
}
```

---

## フロントエンド

### バンドルサイズ

```typescript
// ❌ 全体インポート
import _ from 'lodash'
import { Button } from '@mui/material'

// ✅ 必要な関数のみ
import debounce from 'lodash/debounce'
import Button from '@mui/material/Button'
```

### 遅延ロード

```typescript
// React
const HeavyComponent = React.lazy(() => import('./HeavyComponent'))

// 使用
<Suspense fallback={<Loading />}>
  <HeavyComponent />
</Suspense>
```

### 画像最適化

```html
<!-- 遅延読み込み -->
<img loading="lazy" src="image.jpg" alt="..." />

<!-- 適切なサイズ -->
<img srcset="small.jpg 300w, medium.jpg 600w, large.jpg 900w"
     sizes="(max-width: 600px) 300px, 600px" />

<!-- 次世代フォーマット -->
<picture>
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" />
</picture>
```

---

## 計測

### レスポンスタイム

```typescript
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration
    })
  })
  next()
})
```

### メトリクス

```typescript
// Prometheus形式
const histogram = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'path', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5]
})
```

---

## 目標値

| 指標 | 目標 |
|------|------|
| API レスポンス | < 200ms |
| DBクエリ | < 100ms |
| ページロード (LCP) | < 2.5s |
| バンドルサイズ | < 200KB (gzip) |
