---
name: moneyforward-observer
description: マネーフォワードMEを定点観測し、資産情報を取得。Playwrightで自動ログイン。
---

# MoneyForward Observer Skill

マネーフォワードMEを定点観測し、資産情報を取得するスキル。

## 使用方法

```
/mf-observe [command]
```

### コマンド
- `snapshot`: 現在の資産状況をスナップショット取得
- `history`: 過去のスナップショット履歴を表示
- `diff`: 前回との差分を表示
- `setup`: 初期設定（認証情報の設定）

### 例
```
/mf-observe snapshot
/mf-observe history
/mf-observe diff
```

## 処理フロー

1. **ログイン**: Playwrightでマネーフォワードにログイン
2. **2段階認証**: 必要に応じてユーザーに認証コード入力を促す
3. **データ取得**: 資産総額・口座残高・入出金履歴を取得
4. **保存**: JSONで履歴として保存
5. **差分検出**: 前回との差分を報告

## 取得データ

| データ | 説明 |
|--------|------|
| 資産総額 | 全資産の合計額 |
| 口座別残高 | 各連携口座の残高 |
| 入出金履歴 | 直近の入出金明細 |
| カテゴリ別支出 | 支出のカテゴリ内訳 |

## 出力ファイル

```
/root/moneyforward/
├── config/
│   └── credentials.env      # 認証情報（.gitignore対象）
├── snapshots/
│   └── YYYYMMDD_HHMMSS.json # スナップショット
├── reports/
│   └── YYYYMM_monthly.md    # 月次レポート
└── latest.json              # 最新データへのシンボリックリンク
```

## 設定

### 初期設定

```bash
# 1. ディレクトリ作成
mkdir -p /root/moneyforward/{config,snapshots,reports}

# 2. 認証情報設定
cat > /root/moneyforward/config/credentials.env << 'EOF'
MF_EMAIL=connect24h.now@gmail.com
MF_PASSWORD=your_password_here
EOF

chmod 600 /root/moneyforward/config/credentials.env
```

### Playwright セットアップ

```bash
pip install playwright
playwright install chromium
```

## 実行スクリプト

`/root/moneyforward/scripts/observe.py` を使用。

### 主要機能

1. **ヘッドレスモード**: 通常はヘッドレスで実行
2. **可視モード**: デバッグ時は `--visible` で実行
3. **2段階認証対応**: 認証コード入力を待機

## セキュリティ注意事項

- 認証情報は `.env` ファイルで管理し、絶対にコミットしない
- セッション情報は暗号化して保存
- 定期実行時は適切な間隔を設定（1日1回推奨）

## 制限事項

- マネーフォワードの利用規約を確認の上、自己責任で使用
- UI変更により動作しなくなる可能性あり
- 過度なアクセスは避ける
