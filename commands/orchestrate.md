---
description: タスクを分析し、Claude Code/Codex CLI/Gemini CLIに振り分けて実行。
---

# /orchestrate コマンド

タスクを分析し、最適なCLIに振り分けて実行します。

## 振り分け基準

| 複雑度 | CLI | タスク例 |
|--------|-----|----------|
| 低 | Codex CLI | バグ修正、hotfix、小規模変更 |
| 中 | Gemini CLI | 分析、調査、ドキュメント |
| 高 | Claude Code | リファクタ、新機能、マルチステップ |

## 使用方法

```
/orchestrate [タスクの説明]
```

## 例

```
/orchestrate このファイルのバグを修正して
→ Codex CLI に委譲

/orchestrate コードベース全体の構造を分析して
→ Gemini CLI に委譲

/orchestrate 認証機能をTDDで実装して
→ Claude Code で処理
```

## 並列実行

独立したタスクは並列実行:

```
/orchestrate 以下を並列で実行:
1. src/utils.tsのリファクタ
2. READMEの更新
3. テストの追加
```

## 関連コマンド

- `/delegate-codex` - Codex CLIに直接委譲
- `/delegate-gemini` - Gemini CLIに直接委譲
