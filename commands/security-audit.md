# /security-audit

MCP・Skill導入前のセキュリティ監査を実行

## Usage

```
/security-audit <target>
```

## Arguments

- `<target>`: npm パッケージ名、GitHub URL、またはローカルパス

## Examples

```bash
# npm パッケージ
/security-audit @kevinwatt/yt-dlp-mcp

# GitHub リポジトリ
/security-audit https://github.com/anthropics/claude-code

# ローカルディレクトリ
/security-audit ./my-custom-mcp
```

## Agent

security-auditor

## Output

セキュリティ監査レポート（Markdown形式）
