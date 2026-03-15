#!/usr/bin/env bash
# Claude Code 設定ファイルの整合性を検証
# 使い方: bash ~/.claude/scripts/validate-config.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CI_DIR="$SCRIPT_DIR/ci"
ERRORS=0

echo "=== Claude Code 設定検証 ==="
echo ""

# 1. hooks.json 検証
echo "[1/3] hooks.json を検証中..."
if node "$CI_DIR/validate-hooks.js"; then
  echo "  OK"
else
  echo "  FAIL"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. コマンド検証
echo "[2/3] コマンドを検証中..."
if node "$CI_DIR/validate-commands.js"; then
  echo "  OK"
else
  echo "  FAIL"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# 3. スキル検証
echo "[3/3] スキルを検証中..."
if node "$CI_DIR/validate-skills.js"; then
  echo "  OK"
else
  echo "  FAIL"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# 結果
echo "========================="
if [ "$ERRORS" -eq 0 ]; then
  echo "全ての検証に成功しました"
  exit 0
else
  echo "エラー: ${ERRORS} 件の検証に失敗しました"
  exit 1
fi
