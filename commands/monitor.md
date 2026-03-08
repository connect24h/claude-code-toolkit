---
description: tmuxモニタリングダッシュボードを起動し、エージェント活動をリアルタイム監視
user_invocable: true
---

# /monitor コマンド

tmux モニタリングダッシュボードを管理します。

## 使用方法

`$ARGUMENTS` にサブコマンドを受け取ります（デフォルト: start）。

## 実行手順

1. `$ARGUMENTS` を解析（start / stop / refresh）
2. 以下のコマンドを Bash で実行:

```bash
bash ~/.claude/scripts/tmux-monitor.sh $ARGUMENTS
```

## サブコマンド

- **start** — モニタリングセッションを起動（デフォルト）
- **stop** — モニタリングセッションを停止
- **refresh** — ダッシュボードを手動更新

## tmux ペインレイアウト

```
┌─────────────────────────────────────┐
│  Pane 0: Dashboard (2秒自動更新)     │
│  .claude-dashboard.md              │
├──────────────────┬──────────────────┤
│  Pane 1: Log     │  Pane 2: Files   │
│  activity.log    │  最近の変更ファイル│
└──────────────────┴──────────────────┘
```

## 注意

- 別ターミナルで `tmux attach -t claude-monitor-<project>` でも接続可能
- モニターはバックグラウンドで動作し、Claude Code の作業に影響しない
