---
name: security-audit
description: MCP・Skill導入前のセキュリティ監査。ソースコード信頼性、依存関係、権限範囲を評価。
trigger: "MCP導入", "Skill導入", "新規パッケージ"
---

# security-audit

MCP・Skill導入前のセキュリティ監査スキル

## Trigger

- `/security-audit <package-name-or-url>`
- 新しいMCP/Skillを導入しようとした時

## Process

### Step 1: 情報収集

```bash
# npm パッケージの場合
npm view <package> --json

# GitHub リポジトリの場合
gh api repos/{owner}/{repo}
gh api repos/{owner}/{repo}/commits?per_page=5
gh api repos/{owner}/{repo}/contributors?per_page=10
```

### Step 2: 依存関係チェック

```bash
# npm パッケージ
npm audit --json <package>

# Python パッケージ
pip-audit <package>
```

### Step 3: ソースコード静的解析

危険なパターンを検索:
- `eval(`, `exec(`, `Function(`
- `child_process`, `subprocess`
- `fs.write`, `os.remove`
- `fetch(`, `axios.post` (外部通信)
- `process.env`, `os.environ`
- Base64エンコードされた文字列
- 難読化されたコード

### Step 4: 権限分析

MCP設定から権限を抽出:
- `command`: 実行されるコマンド
- `args`: 引数
- `env`: 環境変数

### Step 5: レポート生成

security-auditor エージェントの出力形式に従う

## Example Usage

```
User: /security-audit @kevinwatt/yt-dlp-mcp

Agent: セキュリティ監査を実行します...

# セキュリティ監査レポート

## 対象
- 名前: @kevinwatt/yt-dlp-mcp
- 種類: MCP
- リポジトリ: https://github.com/kevinwatt/yt-dlp-mcp

## リスク評価

| カテゴリ | スコア | 詳細 |
|----------|--------|------|
| ソースコード信頼性 | 🟡 | スター数少、最終更新1ヶ月前 |
| 権限範囲 | 🟡 | ファイルシステム書き込みあり |
| データ取り扱い | 🟢 | 外部送信なし |
| 実行環境 | 🟢 | stdio通信のみ |

## 総合評価
- **リスクレベル**: LOW
- **推奨**: 導入可

## 検出された問題
1. yt-dlp の subprocess 実行あり

## 緩和策
1. 出力ディレクトリを制限
2. --restrict-filenames オプション推奨
```

## Integration

このスキルは以下と連携:
- `/orchestrate` - 新規MCP導入前に自動呼び出し
- `/evolve` - 新規スキル昇格前にチェック

## 関連エージェント

- `security-auditor`: MCP/Skill導入前監査エージェント

## 関連コマンド

- `/security-audit`: セキュリティ監査を明示的に開始
