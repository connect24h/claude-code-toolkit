---
description: タスクをGemini CLIに委譲。分析、調査、ドキュメント生成に最適。
---

# /delegate-gemini コマンド

タスクをGemini CLIに直接委譲します。

## Gemini CLIの得意分野

- 大規模コードベースの分析
- ドキュメント生成
- 画像/UI関連の作業
- 調査・リサーチタスク
- 大量のファイル読解

## 使用方法

```
/delegate-gemini [タスクの説明]
```

## 例

```
/delegate-gemini このプロジェクトの全体構造を分析
/delegate-gemini API仕様書を生成
/delegate-gemini このスクリーンショットのUIを分析
```

## 実行されるコマンド

```bash
# 分析タスク
gemini "タスクの説明"

# 自動承認モード
gemini "タスクの説明" --approval-mode yolo
```

## 注意事項

- コード変更はClaude CodeまたはCodex CLIで
- 200万トークンの大コンテキスト対応
- 画像ファイル対応
