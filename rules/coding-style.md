---
name: coding-style
description: コーディングスタイルのルール
---

# コーディングスタイル

## 言語・フレームワーク

- **言語**: TypeScript（JavaScript不可。必ず `.ts` / `.tsx` を使用）
- **テストフレームワーク**: Vitest（Jest不可）
- **テストファイル**: `*.test.ts` / `*.spec.ts`

## 命名規則

- **変数/関数**: camelCase (`getUserById`)
- **クラス/型**: PascalCase (`UserService`)
- **定数**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **ファイル**: kebab-case (`user-service.ts`)

## 関数

- **長さ**: 50行以内
- **引数**: 4つ以内
- **ネスト**: 4レベル以内
- **単一責任**: 1つのことだけ行う

## コメント

- 自明なコードにはコメント不要
- 「なぜ」を説明、「何を」は不要
- TODO/FIXMEには期限と担当者

## 禁止事項

- `any` 型の使用
- `console.log` の本番コード残留
- ハードコードされた機密情報
- 未使用のimport/変数

## 推奨事項

- 早期リターン
- オプショナルチェーン (`?.`)
- Nullish coalescing (`??`)
- テンプレートリテラル
