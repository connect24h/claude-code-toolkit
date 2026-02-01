---
description: タスクをCodex CLIに委譲。単純なバグ修正、小規模変更、レビューに最適。
---

# /delegate-codex コマンド

タスクをCodex CLIに直接委譲します。

## Codex CLIの得意分野

- 単純なバグ修正
- 小規模な変更（1-2ファイル）
- 素早いコードレビュー
- 単発のタスク
- hotfix

## 使用方法

```
/delegate-codex [タスクの説明]
```

## 例

```
/delegate-codex src/utils.ts の未使用変数を削除
/delegate-codex このPRをレビュー
/delegate-codex console.logを全て削除
```

## 実行されるコマンド

```bash
# タスク実行
codex exec "タスクの説明"

# レビュー
codex review

# 差分適用
codex apply
```

## 注意事項

- 複雑なタスクはClaude Codeで処理
- タイムアウト: 5分
- 失敗時はClaude Codeにエスカレート
