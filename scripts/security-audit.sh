#!/bin/bash
# MCP/Skill セキュリティ監査スクリプト
# Usage: ./security-audit.sh <package-name-or-url>

set -e

TARGET="$1"
REPORT_DIR="/root/.claude/security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$REPORT_DIR"

# 色定義
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

log() { echo -e "[$(date '+%H:%M:%S')] $1"; }
warn() { echo -e "${YELLOW}⚠ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}"; }
ok() { echo -e "${GREEN}✓ $1${NC}"; }

if [ -z "$TARGET" ]; then
    echo "Usage: $0 <package-name-or-url>"
    exit 1
fi

log "=== セキュリティ監査開始: $TARGET ==="

# ターゲット種別判定
if [[ "$TARGET" == https://github.com/* ]]; then
    TYPE="github"
    OWNER=$(echo "$TARGET" | cut -d'/' -f4)
    REPO=$(echo "$TARGET" | cut -d'/' -f5)
elif [[ "$TARGET" == ./* ]] || [[ "$TARGET" == /* ]]; then
    TYPE="local"
    LOCAL_PATH="$TARGET"
else
    TYPE="npm"
    PACKAGE="$TARGET"
fi

REPORT="$REPORT_DIR/${TARGET//\//_}_${TIMESTAMP}.md"

cat > "$REPORT" << EOF
# セキュリティ監査レポート

- **対象**: $TARGET
- **種類**: $TYPE
- **監査日時**: $(date '+%Y-%m-%d %H:%M:%S')

---

EOF

# === 1. リポジトリ/パッケージ情報 ===
echo "## 1. 基本情報" >> "$REPORT"
echo "" >> "$REPORT"

if [ "$TYPE" = "github" ]; then
    log "GitHub リポジトリ情報を取得..."

    REPO_INFO=$(gh api "repos/$OWNER/$REPO" 2>/dev/null || echo "{}")

    STARS=$(echo "$REPO_INFO" | jq -r '.stargazers_count // "N/A"')
    FORKS=$(echo "$REPO_INFO" | jq -r '.forks_count // "N/A"')
    OPEN_ISSUES=$(echo "$REPO_INFO" | jq -r '.open_issues_count // "N/A"')
    UPDATED=$(echo "$REPO_INFO" | jq -r '.updated_at // "N/A"')
    LICENSE=$(echo "$REPO_INFO" | jq -r '.license.spdx_id // "None"')

    cat >> "$REPORT" << EOF
| 項目 | 値 |
|------|------|
| スター数 | $STARS |
| フォーク数 | $FORKS |
| オープンIssue | $OPEN_ISSUES |
| 最終更新 | $UPDATED |
| ライセンス | $LICENSE |

EOF

    # 信頼性スコア
    if [ "$STARS" != "N/A" ] && [ "$STARS" -gt 100 ]; then
        TRUST_SCORE="🟢 HIGH"
    elif [ "$STARS" != "N/A" ] && [ "$STARS" -gt 10 ]; then
        TRUST_SCORE="🟡 MEDIUM"
    else
        TRUST_SCORE="🔴 LOW"
    fi
    echo "**信頼性スコア**: $TRUST_SCORE" >> "$REPORT"
    echo "" >> "$REPORT"

elif [ "$TYPE" = "npm" ]; then
    log "npm パッケージ情報を取得..."

    NPM_INFO=$(npm view "$PACKAGE" --json 2>/dev/null || echo "{}")

    if [ "$NPM_INFO" != "{}" ]; then
        VERSION=$(echo "$NPM_INFO" | jq -r '.version // "N/A"')
        DOWNLOADS=$(npm view "$PACKAGE" downloads 2>/dev/null || echo "N/A")
        MAINTAINERS=$(echo "$NPM_INFO" | jq -r '.maintainers | length // 0')

        cat >> "$REPORT" << EOF
| 項目 | 値 |
|------|------|
| バージョン | $VERSION |
| メンテナー数 | $MAINTAINERS |

EOF
    else
        warn "パッケージ情報を取得できませんでした"
        echo "⚠ パッケージ情報を取得できませんでした" >> "$REPORT"
    fi
fi

# === 2. 依存関係チェック ===
echo "" >> "$REPORT"
echo "## 2. 依存関係チェック" >> "$REPORT"
echo "" >> "$REPORT"

if [ "$TYPE" = "npm" ]; then
    log "npm audit を実行..."

    # 一時ディレクトリで依存関係をチェック
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    echo "{\"dependencies\": {\"$PACKAGE\": \"latest\"}}" > package.json
    npm install --package-lock-only 2>/dev/null || true

    AUDIT_RESULT=$(npm audit --json 2>/dev/null || echo "{}")
    VULN_COUNT=$(echo "$AUDIT_RESULT" | jq '.metadata.vulnerabilities.total // 0')
    HIGH_VULN=$(echo "$AUDIT_RESULT" | jq '.metadata.vulnerabilities.high // 0')
    CRITICAL_VULN=$(echo "$AUDIT_RESULT" | jq '.metadata.vulnerabilities.critical // 0')

    cat >> "$REPORT" << EOF
| 脆弱性レベル | 件数 |
|--------------|------|
| Critical | $CRITICAL_VULN |
| High | $HIGH_VULN |
| Total | $VULN_COUNT |

EOF

    if [ "$CRITICAL_VULN" -gt 0 ] || [ "$HIGH_VULN" -gt 0 ]; then
        echo "**依存関係スコア**: 🔴 CRITICAL" >> "$REPORT"
    elif [ "$VULN_COUNT" -gt 0 ]; then
        echo "**依存関係スコア**: 🟡 WARNING" >> "$REPORT"
    else
        echo "**依存関係スコア**: 🟢 CLEAN" >> "$REPORT"
    fi

    cd - > /dev/null
    rm -rf "$TEMP_DIR"
else
    echo "（npm以外のパッケージは手動確認が必要）" >> "$REPORT"
fi

# === 3. 危険なパターン検出 ===
echo "" >> "$REPORT"
echo "## 3. コードパターン分析" >> "$REPORT"
echo "" >> "$REPORT"

DANGEROUS_PATTERNS=(
    "eval("
    "exec("
    "Function("
    "child_process"
    "subprocess"
    "os.system"
    "shell=True"
    "dangerouslySetInnerHTML"
    "innerHTML"
    "document.write"
)

echo "検出対象パターン:" >> "$REPORT"
echo "" >> "$REPORT"
echo '```' >> "$REPORT"
for pattern in "${DANGEROUS_PATTERNS[@]}"; do
    echo "- $pattern"
done >> "$REPORT"
echo '```' >> "$REPORT"
echo "" >> "$REPORT"

if [ "$TYPE" = "github" ]; then
    log "リポジトリをクローンして分析..."
    TEMP_DIR=$(mktemp -d)
    git clone --depth 1 "https://github.com/$OWNER/$REPO" "$TEMP_DIR/repo" 2>/dev/null || true

    if [ -d "$TEMP_DIR/repo" ]; then
        echo "### 検出結果" >> "$REPORT"
        echo "" >> "$REPORT"

        FOUND_ISSUES=0
        for pattern in "${DANGEROUS_PATTERNS[@]}"; do
            MATCHES=$(grep -r "$pattern" "$TEMP_DIR/repo" --include="*.js" --include="*.ts" --include="*.py" 2>/dev/null | head -5 || true)
            if [ -n "$MATCHES" ]; then
                FOUND_ISSUES=$((FOUND_ISSUES + 1))
                echo "#### \`$pattern\` 検出" >> "$REPORT"
                echo '```' >> "$REPORT"
                echo "$MATCHES" >> "$REPORT"
                echo '```' >> "$REPORT"
                echo "" >> "$REPORT"
            fi
        done

        if [ "$FOUND_ISSUES" -eq 0 ]; then
            ok "危険なパターンは検出されませんでした"
            echo "✅ 危険なパターンは検出されませんでした" >> "$REPORT"
        else
            warn "$FOUND_ISSUES 件の潜在的な問題を検出"
            echo "⚠ **$FOUND_ISSUES 件の潜在的な問題を検出**" >> "$REPORT"
        fi

        rm -rf "$TEMP_DIR"
    fi
fi

# === 4. 総合評価 ===
echo "" >> "$REPORT"
echo "## 4. 総合評価" >> "$REPORT"
echo "" >> "$REPORT"

cat >> "$REPORT" << EOF
| カテゴリ | スコア |
|----------|--------|
| ソースコード信頼性 | ${TRUST_SCORE:-🟡 UNKNOWN} |
| 依存関係 | ${DEP_SCORE:-🟡 UNKNOWN} |
| コードパターン | ${CODE_SCORE:-🟡 UNKNOWN} |

### 推奨アクション

1. 本番導入前に詳細なコードレビューを実施
2. 最小権限の原則に従って設定
3. サンドボックス環境でテスト
4. 定期的なアップデート確認

EOF

log "=== 監査完了 ==="
log "レポート: $REPORT"

cat "$REPORT"
