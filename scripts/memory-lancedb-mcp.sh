#!/bin/bash
# Memory LanceDB MCP launcher
#
# Embeddingプロバイダー (MEMORY_EMBEDDING_PROVIDER で指定):
#   codex-ollama  → Codex CLI で意味抽出 + Ollama でベクトル化
#   gemini-ollama → Gemini CLI で意味抽出 + Ollama でベクトル化
#   claude-ollama → Claude Code CLI で意味抽出 + Ollama でベクトル化
#   ollama        → Ollama のみ（デフォルト、最速）
#   openai/gemini/voyage → API直接（要APIキー）
set -e

CLAUDE_DIR="${HOME}/.claude"

# SOPS暗号化されたAPIキーを復号（存在する場合）
if [ -f "${CLAUDE_DIR}/.env.enc" ]; then
  source "${CLAUDE_DIR}/scripts/lib/decrypt-env.sh" "${CLAUDE_DIR}/.env.enc" 2>/dev/null || true
fi

# デフォルトプロバイダー: ollama（最速・APIキー不要）
export MEMORY_EMBEDDING_PROVIDER="${MEMORY_EMBEDDING_PROVIDER:-ollama}"

# memory-lancedb-mcp のパスを環境に合わせて設定してください
MEMORY_MCP_DIR="${MEMORY_MCP_DIR:-${HOME}/memory-lancedb-mcp}"
exec npx --prefix "$MEMORY_MCP_DIR" tsx "${MEMORY_MCP_DIR}/src/index.ts"
