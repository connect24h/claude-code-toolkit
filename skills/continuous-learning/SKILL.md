---
name: continuous-learning
description: 継続学習システム。セッション中のパターンを抽出し、instinctsとして保存。
trigger: "SessionEnd"
---

# Continuous Learning スキル

セッション中のパターンを抽出し、知識として蓄積します。

## 仕組み

```
セッション中の行動
       ↓
パターン抽出
       ↓
instinctsとして保存
       ↓
一定回数観測されたら昇格
       ↓
Command / Skill / Agent
```

## Instinctsの構造

```yaml
# ~/.claude/homunculus/instincts/instinct-001.yaml
id: instinct-001
trigger: "データベーステーブル追加"
action: "マイグレーション → スキーマ更新 → 型生成"
observations: 5
confidence: 0.85
domain: database
created: 2026-01-30
```

## 進化ルール

### → Command（ユーザー呼び出し）
- ユーザーが明示的に要求するアクション
- 繰り返し可能なシーケンス
- 3つ以上の関連instincts

### → Skill（自動トリガー）
- パターンマッチングで自動適用
- エラーハンドリング
- コードスタイル強制

### → Agent（深い処理）
- 複雑なマルチステップ
- 調査・分析タスク
- 専門知識が必要

## コマンド

```
/evolve              # 進化分析
/instinct-status     # 蓄積されたinstinctsを表示
/learn [パターン]    # 明示的にパターンを記録
```

## 保存場所

```
~/.claude/homunculus/
├── instincts/           # 学習したパターン
│   ├── instinct-001.yaml
│   └── instinct-002.yaml
└── evolved/             # 進化した構造
    ├── commands/
    ├── skills/
    └── agents/
```

## 注意事項

- 自動学習は控えめに
- ユーザーの承認を得てから進化
- 信頼度が低いinstinctsは削除可能
