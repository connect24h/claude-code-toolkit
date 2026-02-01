---
description: 蓄積されたパターンを分析し、スキル/コマンド/エージェントに昇格。
---

# /evolve コマンド

継続学習システムで蓄積されたパターン（instincts）を分析し、より高度な構造に進化させます。

## このコマンドがすること

1. **instincts読み込み** - 蓄積されたパターンを取得
2. **クラスタリング** - 関連パターンをグループ化
3. **進化判定** - 適切な構造を決定
4. **生成** - コマンド/スキル/エージェントを作成

## 進化ルール

### → Command（ユーザー呼び出し）
ユーザーが明示的に要求するアクション:
- 「〜を作成」
- 「〜を実行」
- 繰り返し可能なシーケンス

### → Skill（自動トリガー）
自動的に適用される動作:
- パターンマッチングトリガー
- エラーハンドリング
- コードスタイル強制

### → Agent（深い処理が必要）
複雑なマルチステッププロセス:
- デバッグワークフロー
- リファクタリングシーケンス
- 調査タスク

## 使用方法

```
/evolve              # 分析と提案
/evolve --execute    # 実際に作成
/evolve --dry-run    # プレビューのみ
```

## 出力例

```markdown
# 進化分析

## クラスター1: データベース操作ワークフロー
instincts: new-table-migration, update-schema, regenerate-types
タイプ: Command
信頼度: 85%

→ /new-table コマンドを作成

## クラスター2: 関数型コーディングスタイル
instincts: prefer-functional, use-immutable, avoid-classes
タイプ: Skill
信頼度: 78%

→ functional-patterns スキルを作成
```

## 関連コマンド

- `/instinct-status` - 蓄積されたパターンを表示
- `/learn` - 明示的にパターンを記録
