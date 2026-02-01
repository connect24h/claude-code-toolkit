---
name: error-handling
description: エラーハンドリングルール
---

# エラーハンドリングルール

## 基本原則

- エラーは早期にキャッチ
- 適切な粒度で処理
- ユーザーには安全なメッセージ
- 開発者には詳細なログ

---

## エラーの種類

### 運用エラー（Operational）
予測可能、回復可能

```typescript
// 例: バリデーションエラー、認証エラー
class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

### プログラマーエラー（Programmer）
バグ、即座に修正が必要

```typescript
// 例: TypeError、ReferenceError
// → ログして再起動
```

---

## カスタムエラークラス

```typescript
// ベースエラー
class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public isOperational = true
  ) {
    super(message)
    Error.captureStackTrace(this, this.constructor)
  }
}

// 派生エラー
class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} not found`)
  }
}

class ValidationError extends AppError {
  constructor(message: string, public details?: object) {
    super(422, 'VALIDATION_ERROR', message)
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message)
  }
}
```

---

## グローバルエラーハンドラー

### Express

```typescript
// エラーハンドラー（最後に配置）
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // ログ記録
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  })

  // AppErrorの場合
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
      }
    })
  }

  // 予期しないエラー
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    }
  })
})
```

### 未処理エラーのキャッチ

```typescript
process.on('uncaughtException', (err) => {
  logger.fatal('Uncaught Exception:', err)
  process.exit(1)
})

process.on('unhandledRejection', (reason) => {
  logger.fatal('Unhandled Rejection:', reason)
  process.exit(1)
})
```

---

## async/await パターン

### try-catch

```typescript
async function getUser(id: string) {
  try {
    const user = await db.users.findById(id)
    if (!user) throw new NotFoundError('User')
    return user
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError(500, 'DB_ERROR', 'Database error')
  }
}
```

### ラッパー関数

```typescript
// Express用ラッパー
const asyncHandler = (fn: Function) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// 使用
app.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await getUser(req.params.id)
  res.json({ data: user })
}))
```

---

## Result型パターン

```typescript
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }

async function findUser(id: string): Promise<Result<User>> {
  try {
    const user = await db.users.findById(id)
    if (!user) return { success: false, error: new NotFoundError('User') }
    return { success: true, data: user }
  } catch (error) {
    return { success: false, error: error as Error }
  }
}

// 使用
const result = await findUser(id)
if (!result.success) {
  // エラー処理
}
const user = result.data
```

---

## ログレベル

| レベル | 用途 |
|--------|------|
| fatal | アプリ停止が必要 |
| error | エラー発生 |
| warn | 警告 |
| info | 重要な情報 |
| debug | デバッグ用 |

---

## 禁止事項

```typescript
// ❌ 空のcatch
try { ... } catch (e) { }

// ❌ エラーを握りつぶす
catch (e) { return null }

// ❌ スタックトレースをユーザーに公開
res.json({ error: err.stack })

// ❌ console.log/console.error（本番）
console.error(err)
```

---

## 推奨事項

```typescript
// ✅ エラーを再スロー
catch (e) {
  logger.error(e)
  throw e
}

// ✅ 適切なエラー変換
catch (e) {
  throw new AppError(500, 'SERVICE_ERROR', 'Service unavailable')
}

// ✅ 構造化ログ
logger.error({
  message: err.message,
  code: err.code,
  stack: err.stack,
  context: { userId, action }
})
```
