---
description: ビルドエラーを解決。エラーログを分析し、原因を特定して修正。
---

# /build-fix コマンド

build-error-resolverエージェントを呼び出して、ビルドエラーを解決します。

## このコマンドがすること

1. **エラー収集** - ビルドログを取得
2. **エラー分析** - 原因を特定
3. **修正実施** - コードを修正
4. **検証** - ビルド成功を確認

## いつ使うか

- ビルドが失敗したとき
- 型エラーが発生したとき
- コンパイルエラーがあるとき

## 使用方法

```
/build-fix
```

## 解決プロセス

```
エラー収集 → 分類 → 原因分析 → 修正 → 検証
                                    ↓
                            失敗なら繰り返し
```

## よくあるエラー

### 型エラー
```typescript
// Type 'string' is not assignable to type 'number'
// → 型を合わせる
```

### インポートエラー
```typescript
// Module not found
// → パスを確認 or パッケージをインストール
```

### null/undefined
```typescript
// Object is possibly 'undefined'
// → オプショナルチェーン or アサーション
```

## 関連コマンド

- `/verify` - 包括的な検証
- `/tdd` - TDDで実装
