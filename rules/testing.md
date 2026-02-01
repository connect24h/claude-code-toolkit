---
name: testing
description: テストのルール
---

# テストルール

## カバレッジ要件

- **80%以上**: 通常のコード
- **100%**: 重要なコード
  - 金融計算
  - 認証ロジック
  - セキュリティ関連

## テストの種類

### ユニットテスト
- 各関数/メソッドをテスト
- 外部依存はモック
- 高速に実行

### 統合テスト
- コンポーネント間の連携
- データベース操作
- API呼び出し

### E2Eテスト
- クリティカルパス
- ユーザーフロー全体
- 本番に近い環境

## テストの書き方

### 命名
```typescript
it('should return user when valid id is provided', () => {})
it('should throw error when id is invalid', () => {})
```

### 構造（AAA）
```typescript
it('should calculate total', () => {
  // Arrange（準備）
  const items = [{ price: 100 }, { price: 200 }]

  // Act（実行）
  const total = calculateTotal(items)

  // Assert（検証）
  expect(total).toBe(300)
})
```

## 禁止事項

- 実装詳細のテスト
- テスト間の依存
- 非決定的なテスト
- 遅すぎるテスト

## 推奨事項

- 失敗するテストを先に書く
- エッジケースをカバー
- エラーケースをテスト
- テストを読みやすく
