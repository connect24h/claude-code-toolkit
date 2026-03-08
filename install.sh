#!/bin/bash
# Claude Code Toolkit Installer
# ~/.claude/ 配下にツールキットの全コンポーネントをインストール
#
# 使い方:
#   git clone https://github.com/connect24h/claude-code-toolkit.git
#   cd claude-code-toolkit
#   chmod +x install.sh
#   ./install.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${HOME}/.claude"

echo "=== Claude Code Toolkit Installer ==="
echo ""
echo "インストール先: $CLAUDE_DIR"
echo ""

# バックアップ作成
if [ -d "$CLAUDE_DIR" ]; then
    BACKUP_DIR="${CLAUDE_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
    echo "既存の設定をバックアップ中: $BACKUP_DIR"
    cp -r "$CLAUDE_DIR" "$BACKUP_DIR"
fi

# ディレクトリ作成
echo "ディレクトリを作成中..."
mkdir -p "$CLAUDE_DIR"/{agents,commands,skills,rules,hooks,scripts/hooks,scripts/lib}

# ファイルコピー
echo "ファイルをコピー中..."

# Skills (ディレクトリごとコピー)
if [ -d "$SCRIPT_DIR/skills" ]; then
    cp -r "$SCRIPT_DIR/skills/"* "$CLAUDE_DIR/skills/" 2>/dev/null || true
    SKILL_COUNT=$(find "$CLAUDE_DIR/skills" -maxdepth 1 -type d | wc -l)
    echo "  skills/ ($((SKILL_COUNT - 1)) スキルディレクトリ)"
fi

# Commands
if [ -d "$SCRIPT_DIR/commands" ]; then
    cp -r "$SCRIPT_DIR/commands/"* "$CLAUDE_DIR/commands/" 2>/dev/null || true
    CMD_COUNT=$(ls "$SCRIPT_DIR/commands/"*.md 2>/dev/null | wc -l)
    echo "  commands/ ($CMD_COUNT コマンド)"
fi

# Agents
if [ -d "$SCRIPT_DIR/agents" ]; then
    cp -r "$SCRIPT_DIR/agents/"* "$CLAUDE_DIR/agents/" 2>/dev/null || true
    AGENT_COUNT=$(ls "$SCRIPT_DIR/agents/"*.md 2>/dev/null | wc -l)
    echo "  agents/ ($AGENT_COUNT エージェント)"
fi

# Rules
if [ -d "$SCRIPT_DIR/rules" ]; then
    cp -r "$SCRIPT_DIR/rules/"* "$CLAUDE_DIR/rules/" 2>/dev/null || true
    RULE_COUNT=$(ls "$SCRIPT_DIR/rules/"*.md 2>/dev/null | wc -l)
    echo "  rules/ ($RULE_COUNT ルール)"
fi

# Hooks
if [ -f "$SCRIPT_DIR/hooks/hooks.json" ]; then
    cp "$SCRIPT_DIR/hooks/hooks.json" "$CLAUDE_DIR/hooks/"
    echo "  hooks/hooks.json"
fi

# Hook scripts (JS)
if [ -d "$SCRIPT_DIR/scripts/hooks" ]; then
    cp "$SCRIPT_DIR/scripts/hooks/"*.js "$CLAUDE_DIR/scripts/hooks/" 2>/dev/null || true
    echo "  scripts/hooks/ (フックハンドラー)"
fi

# Lib scripts
if [ -d "$SCRIPT_DIR/scripts/lib" ]; then
    cp "$SCRIPT_DIR/scripts/lib/"* "$CLAUDE_DIR/scripts/lib/" 2>/dev/null || true
    echo "  scripts/lib/ (ユーティリティ)"
fi

# MCP launcher scripts
for launcher in memory-lancedb-mcp.sh google-workspace-mcp.sh; do
    if [ -f "$SCRIPT_DIR/scripts/$launcher" ]; then
        cp "$SCRIPT_DIR/scripts/$launcher" "$CLAUDE_DIR/scripts/"
        chmod +x "$CLAUDE_DIR/scripts/$launcher"
        echo "  scripts/$launcher"
    fi
done

# CLAUDE.md
if [ -f "$CLAUDE_DIR/CLAUDE.md" ]; then
    echo ""
    read -p "既存のCLAUDE.mdを上書きしますか？ (y/N): " answer
    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        cp "$SCRIPT_DIR/CLAUDE.md" "$CLAUDE_DIR/"
        echo "  CLAUDE.md (上書き)"
    else
        echo "  CLAUDE.md (スキップ)"
    fi
else
    cp "$SCRIPT_DIR/CLAUDE.md" "$CLAUDE_DIR/"
    echo "  CLAUDE.md"
fi

# settings.json
if [ ! -f "$CLAUDE_DIR/settings.json" ] && [ -f "$SCRIPT_DIR/settings.json.example" ]; then
    cp "$SCRIPT_DIR/settings.json.example" "$CLAUDE_DIR/settings.json"
    echo "  settings.json (テンプレートからコピー)"
    echo "  ※ 必要に応じてパスを編集してください"
fi

echo ""
echo "=== インストール完了 ==="
echo ""
echo "インストールされた機能:"
echo "  コマンド (52):"
echo "    /plan, /tdd, /verify, /code-review, /build-fix"
echo "    /orchestrate, /delegate-codex, /delegate-gemini"
echo "    /security-audit, /evolve, /marp"
echo "    /pm-* (36 PMコマンド)"
echo ""
echo "  エージェント (10):"
echo "    planner, tdd-guide, code-reviewer, orchestrator"
echo "    security-auditor, build-error-resolver 等"
echo ""
echo "  スキル (13カテゴリ):"
echo "    tdd-workflow, verification-loop, security-audit"
echo "    pm/ (8サブカテゴリ), youtube-channel-observer 等"
echo ""
echo "  フック: セッション管理, コスト追跡, メモリ自動保存"
echo ""
echo "次のステップ:"
echo "  1. Claude Codeを再起動してください"
echo "  2. settings.json のMCPサーバー設定を確認してください"
echo "  3. /plan で実装計画を開始できます"
echo ""
