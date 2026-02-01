#!/bin/bash
# Claude Code Toolkit Installer
# インストールスクリプト

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${HOME}/.claude"

echo "=== Claude Code Toolkit Installer ==="
echo ""

# バックアップ作成
if [ -d "$CLAUDE_DIR" ]; then
    BACKUP_DIR="${CLAUDE_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    echo "既存の設定をバックアップ中: $BACKUP_DIR"
    cp -r "$CLAUDE_DIR" "$BACKUP_DIR"
fi

# ディレクトリ作成
echo "ディレクトリを作成中..."
mkdir -p "$CLAUDE_DIR"/{agents,commands,skills,rules,hooks}

# ファイルコピー
echo "ファイルをコピー中..."

# Agents
if [ -d "$SCRIPT_DIR/agents" ]; then
    cp -r "$SCRIPT_DIR/agents/"* "$CLAUDE_DIR/agents/" 2>/dev/null || true
    echo "  ✓ agents/"
fi

# Commands
if [ -d "$SCRIPT_DIR/commands" ]; then
    cp -r "$SCRIPT_DIR/commands/"* "$CLAUDE_DIR/commands/" 2>/dev/null || true
    echo "  ✓ commands/"
fi

# Skills
if [ -d "$SCRIPT_DIR/skills" ]; then
    cp -r "$SCRIPT_DIR/skills/"* "$CLAUDE_DIR/skills/" 2>/dev/null || true
    echo "  ✓ skills/"
fi

# Rules
if [ -d "$SCRIPT_DIR/rules" ]; then
    cp -r "$SCRIPT_DIR/rules/"* "$CLAUDE_DIR/rules/" 2>/dev/null || true
    echo "  ✓ rules/"
fi

# Hooks
if [ -f "$SCRIPT_DIR/hooks/hooks.json" ]; then
    cp "$SCRIPT_DIR/hooks/hooks.json" "$CLAUDE_DIR/hooks/" 2>/dev/null || true
    echo "  ✓ hooks/"
fi

# CLAUDE.md (マージまたは上書き確認)
if [ -f "$CLAUDE_DIR/CLAUDE.md" ]; then
    echo ""
    read -p "既存のCLAUDE.mdを上書きしますか？ (y/N): " answer
    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        cp "$SCRIPT_DIR/docs/CLAUDE.md" "$CLAUDE_DIR/"
        echo "  ✓ CLAUDE.md (上書き)"
    else
        echo "  - CLAUDE.md (スキップ)"
    fi
else
    cp "$SCRIPT_DIR/docs/CLAUDE.md" "$CLAUDE_DIR/"
    echo "  ✓ CLAUDE.md"
fi

echo ""
echo "=== インストール完了 ==="
echo ""
echo "インストールされた機能:"
echo "  - /orchestrate - タスクオーケストレーション"
echo "  - /delegate-codex - Codex CLI委譲"
echo "  - /delegate-gemini - Gemini CLI委譲"
echo "  - /plan - 実装計画作成"
echo "  - /tdd - テスト駆動開発"
echo "  - /verify - 検証ループ"
echo "  - /code-review - コードレビュー"
echo "  - /build-fix - ビルドエラー解決"
echo "  - /evolve - パターン昇格"
echo ""
echo "Claude Codeを再起動してください。"
