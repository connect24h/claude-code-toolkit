#!/bin/bash
# MCP/Skill セキュリティ監査スクリプト v2
# より厳格なチェックを実施

set -e

TARGET="$1"
REPORT_DIR="$HOME/.claude/security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEMP_DIR=$(mktemp -d)
SANDBOX_DIR="$TEMP_DIR/sandbox"

mkdir -p "$REPORT_DIR" "$SANDBOX_DIR"

# 色定義
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"; }
warn() { echo -e "${YELLOW}⚠ WARNING:${NC} $1"; }
error() { echo -e "${RED}✗ CRITICAL:${NC} $1"; }
ok() { echo -e "${GREEN}✓${NC} $1"; }

if [ -z "$TARGET" ]; then
    echo "Usage: $0 <npm-package | github-url | local-path>"
    echo ""
    echo "Examples:"
    echo "  $0 @kevinwatt/yt-dlp-mcp"
    echo "  $0 https://github.com/owner/repo"
    echo "  $0 ./my-local-mcp"
    exit 1
fi

REPORT="$REPORT_DIR/audit_${TIMESTAMP}.md"
RISK_SCORE=0
CRITICAL_ISSUES=()
HIGH_ISSUES=()
MEDIUM_ISSUES=()

add_critical() { CRITICAL_ISSUES+=("$1"); RISK_SCORE=$((RISK_SCORE + 100)); }
add_high() { HIGH_ISSUES+=("$1"); RISK_SCORE=$((RISK_SCORE + 50)); }
add_medium() { MEDIUM_ISSUES+=("$1"); RISK_SCORE=$((RISK_SCORE + 10)); }

# === ターゲット取得 ===
log "=== セキュリティ監査 v2 開始: $TARGET ==="

if [[ "$TARGET" == https://github.com/* ]]; then
    TYPE="github"
    log "GitHubリポジトリをクローン中..."
    git clone --depth 1 "$TARGET" "$SANDBOX_DIR/repo" 2>/dev/null || {
        error "リポジトリのクローンに失敗"
        exit 1
    }
    CODE_DIR="$SANDBOX_DIR/repo"
elif [[ "$TARGET" == ./* ]] || [[ "$TARGET" == /* ]]; then
    TYPE="local"
    CODE_DIR="$TARGET"
else
    TYPE="npm"
    log "npmパッケージをダウンロード中..."
    cd "$SANDBOX_DIR"
    npm pack "$TARGET" 2>/dev/null || {
        error "パッケージのダウンロードに失敗"
        exit 1
    }
    tar -xzf *.tgz 2>/dev/null
    CODE_DIR="$SANDBOX_DIR/package"
fi

# === 1. 信頼性チェック ===
log "1. 信頼性チェック..."

if [ "$TYPE" = "npm" ]; then
    NPM_INFO=$(npm view "$TARGET" --json 2>/dev/null || echo "{}")

    # メンテナー数
    MAINTAINERS=$(echo "$NPM_INFO" | jq -r '.maintainers | length // 0')
    if [ "$MAINTAINERS" -lt 2 ]; then
        add_medium "メンテナー数が少ない ($MAINTAINERS人)"
    fi

    # 週間ダウンロード数
    DOWNLOADS=$(npm view "$TARGET" downloads 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")
    if [ "${DOWNLOADS:-0}" -lt 100 ]; then
        add_medium "ダウンロード数が少ない (${DOWNLOADS:-0})"
    fi

    # 最終更新
    MODIFIED=$(echo "$NPM_INFO" | jq -r '.time.modified // ""')
    if [ -n "$MODIFIED" ]; then
        DAYS_OLD=$(( ($(date +%s) - $(date -d "$MODIFIED" +%s 2>/dev/null || echo "0")) / 86400 ))
        if [ "$DAYS_OLD" -gt 365 ]; then
            add_medium "1年以上更新されていない (${DAYS_OLD}日前)"
        fi
    fi
fi

# === 2. 危険なコードパターン ===
log "2. 危険なコードパターン検出..."

# CRITICAL: 最も危険なパターン
CRITICAL_PATTERNS=(
    'eval\s*\('
    'new\s+Function\s*\('
    'execSync\s*\('
    'spawnSync.*shell:\s*true'
    'require\s*\(\s*[^"'"'"'`]'  # 動的require
    '__proto__'
    'constructor\[.constructor'
    'process\.binding'
)

for pattern in "${CRITICAL_PATTERNS[@]}"; do
    MATCHES=$(grep -rE "$pattern" "$CODE_DIR" --include="*.js" --include="*.ts" --include="*.mjs" 2>/dev/null | grep -v node_modules | grep -v "\.test\." | grep -v "\.spec\." || true)
    if [ -n "$MATCHES" ]; then
        add_critical "危険なパターン検出: $pattern"
        echo "$MATCHES" >> "$REPORT.details"
    fi
done

# HIGH: 要注意パターン
HIGH_PATTERNS=(
    'child_process'
    'subprocess'
    'os\.system'
    'shell=True'
    'exec\s*\('
    'spawn\s*\('
    'fs\.writeFile'
    'fs\.unlink'
    'fs\.rmdir'
    'rimraf'
)

for pattern in "${HIGH_PATTERNS[@]}"; do
    MATCHES=$(grep -rE "$pattern" "$CODE_DIR" --include="*.js" --include="*.ts" --include="*.py" 2>/dev/null | grep -v node_modules | grep -v "\.test\." || true)
    if [ -n "$MATCHES" ]; then
        add_high "外部プロセス/ファイル操作: $pattern"
    fi
done

# === 3. ネットワーク通信チェック ===
log "3. ネットワーク通信チェック..."

NETWORK_PATTERNS=(
    'fetch\s*\('
    'axios\.'
    'http\.request'
    'https\.request'
    'net\.connect'
    'WebSocket'
    'socket\.io'
)

EXTERNAL_URLS=$(grep -rEoh 'https?://[a-zA-Z0-9.-]+' "$CODE_DIR" --include="*.js" --include="*.ts" 2>/dev/null | grep -v node_modules | sort -u || true)

if [ -n "$EXTERNAL_URLS" ]; then
    # 既知の安全なドメインを除外
    SAFE_DOMAINS="github.com|npmjs.com|googleapis.com|anthropic.com|openai.com|localhost"
    SUSPICIOUS_URLS=$(echo "$EXTERNAL_URLS" | grep -vE "$SAFE_DOMAINS" || true)

    if [ -n "$SUSPICIOUS_URLS" ]; then
        add_high "不明な外部URLへの通信: $(echo "$SUSPICIOUS_URLS" | head -3 | tr '\n' ' ')"
    fi
fi

# === 4. 環境変数・機密情報アクセス ===
log "4. 環境変数・機密情報チェック..."

SECRET_PATTERNS=(
    'process\.env\.'
    'os\.environ'
    'API_KEY'
    'SECRET'
    'TOKEN'
    'PASSWORD'
    'CREDENTIAL'
    'PRIVATE_KEY'
)

for pattern in "${SECRET_PATTERNS[@]}"; do
    MATCHES=$(grep -rE "$pattern" "$CODE_DIR" --include="*.js" --include="*.ts" --include="*.py" 2>/dev/null | grep -v node_modules | grep -v "\.test\." || true)
    if [ -n "$MATCHES" ]; then
        add_medium "機密情報へのアクセス可能性: $pattern"
    fi
done

# === 5. 依存関係チェック ===
log "5. 依存関係チェック..."

if [ -f "$CODE_DIR/package.json" ]; then
    cd "$CODE_DIR"

    # npm audit
    AUDIT_RESULT=$(npm audit --json 2>/dev/null || echo '{"metadata":{"vulnerabilities":{"total":0,"critical":0,"high":0}}}')
    CRITICAL_VULN=$(echo "$AUDIT_RESULT" | jq '.metadata.vulnerabilities.critical // 0')
    HIGH_VULN=$(echo "$AUDIT_RESULT" | jq '.metadata.vulnerabilities.high // 0')

    if [ "$CRITICAL_VULN" -gt 0 ]; then
        add_critical "依存関係にCritical脆弱性: ${CRITICAL_VULN}件"
    fi
    if [ "$HIGH_VULN" -gt 0 ]; then
        add_high "依存関係にHigh脆弱性: ${HIGH_VULN}件"
    fi

    # 依存関係の数
    DEP_COUNT=$(jq '.dependencies | length // 0' package.json 2>/dev/null)
    if [ "${DEP_COUNT:-0}" -gt 50 ]; then
        add_medium "依存関係が多い (${DEP_COUNT}個)"
    fi
fi

# === 6. 難読化チェック ===
log "6. 難読化チェック..."

# Base64エンコードされた長い文字列
BASE64_MATCHES=$(grep -rE '[A-Za-z0-9+/]{50,}={0,2}' "$CODE_DIR" --include="*.js" 2>/dev/null | grep -v node_modules | wc -l || echo "0")
if [ "$BASE64_MATCHES" -gt 5 ]; then
    add_high "Base64エンコードされた文字列が多い (${BASE64_MATCHES}件)"
fi

# 難読化されたコード（短い変数名の連続）
OBFUSCATED=$(grep -rE '\b[a-z]\s*=\s*[a-z]\s*\(' "$CODE_DIR" --include="*.js" 2>/dev/null | grep -v node_modules | wc -l || echo "0")
if [ "$OBFUSCATED" -gt 20 ]; then
    add_high "難読化されたコードの可能性 (${OBFUSCATED}件)"
fi

# === 7. ファイル操作スコープ ===
log "7. ファイルアクセススコープ..."

# ホームディレクトリ外へのアクセス
DANGEROUS_PATHS=$(grep -rE '(/etc/|/var/|/usr/|/root/\.|~/\.|\\.\\./)' "$CODE_DIR" --include="*.js" --include="*.ts" 2>/dev/null | grep -v node_modules || true)
if [ -n "$DANGEROUS_PATHS" ]; then
    add_critical "システムディレクトリへのアクセス試行"
fi

# === レポート生成 ===
log "レポート生成中..."

cat > "$REPORT" << EOF
# セキュリティ監査レポート v2

- **対象**: $TARGET
- **種類**: $TYPE
- **監査日時**: $(date '+%Y-%m-%d %H:%M:%S')
- **リスクスコア**: $RISK_SCORE

---

## 総合評価

EOF

if [ "$RISK_SCORE" -ge 100 ]; then
    echo "### ⛔ CRITICAL - 導入不可" >> "$REPORT"
    echo "" >> "$REPORT"
    echo "重大なセキュリティリスクが検出されました。このパッケージの導入は推奨しません。" >> "$REPORT"
elif [ "$RISK_SCORE" -ge 50 ]; then
    echo "### 🔴 HIGH - 詳細レビュー必要" >> "$REPORT"
    echo "" >> "$REPORT"
    echo "高リスクの問題が検出されました。導入前に詳細なコードレビューが必要です。" >> "$REPORT"
elif [ "$RISK_SCORE" -ge 10 ]; then
    echo "### 🟡 MEDIUM - 条件付き導入可" >> "$REPORT"
    echo "" >> "$REPORT"
    echo "中程度のリスクが検出されました。緩和策を検討してください。" >> "$REPORT"
else
    echo "### 🟢 LOW - 導入可" >> "$REPORT"
    echo "" >> "$REPORT"
    echo "重大な問題は検出されませんでした。" >> "$REPORT"
fi

echo "" >> "$REPORT"
echo "---" >> "$REPORT"
echo "" >> "$REPORT"
echo "## 検出された問題" >> "$REPORT"
echo "" >> "$REPORT"

if [ ${#CRITICAL_ISSUES[@]} -gt 0 ]; then
    echo "### ⛔ Critical" >> "$REPORT"
    for issue in "${CRITICAL_ISSUES[@]}"; do
        echo "- $issue" >> "$REPORT"
    done
    echo "" >> "$REPORT"
fi

if [ ${#HIGH_ISSUES[@]} -gt 0 ]; then
    echo "### 🔴 High" >> "$REPORT"
    for issue in "${HIGH_ISSUES[@]}"; do
        echo "- $issue" >> "$REPORT"
    done
    echo "" >> "$REPORT"
fi

if [ ${#MEDIUM_ISSUES[@]} -gt 0 ]; then
    echo "### 🟡 Medium" >> "$REPORT"
    for issue in "${MEDIUM_ISSUES[@]}"; do
        echo "- $issue" >> "$REPORT"
    done
    echo "" >> "$REPORT"
fi

if [ ${#CRITICAL_ISSUES[@]} -eq 0 ] && [ ${#HIGH_ISSUES[@]} -eq 0 ] && [ ${#MEDIUM_ISSUES[@]} -eq 0 ]; then
    echo "問題は検出されませんでした。" >> "$REPORT"
fi

cat >> "$REPORT" << 'EOF'

---

## 推奨緩和策

1. **サンドボックス実行**: Dockerコンテナ内でMCPを実行
2. **ネットワーク制限**: 必要なドメインのみ許可
3. **ファイルアクセス制限**: 特定ディレクトリのみアクセス許可
4. **環境変数の最小化**: 必要最低限の環境変数のみ渡す
5. **定期的な監査**: 依存関係の更新とセキュリティ監査

---

## サンドボックス実行例

```bash
# Docker でMCPを実行
docker run --rm -it \
  --network none \
  --read-only \
  --tmpfs /tmp \
  -v /path/to/allowed:/data:ro \
  node:20-slim npx <mcp-package>
```

EOF

# クリーンアップ
rm -rf "$TEMP_DIR"

log "=== 監査完了 ==="
log "レポート: $REPORT"
log "リスクスコア: $RISK_SCORE"

echo ""
cat "$REPORT"

# 終了コード
if [ "$RISK_SCORE" -ge 100 ]; then
    exit 2  # Critical
elif [ "$RISK_SCORE" -ge 50 ]; then
    exit 1  # High
else
    exit 0  # OK
fi
