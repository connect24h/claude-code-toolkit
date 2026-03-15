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

# SOPS暗号化されたAPIキーを復号（存在する場合）
if [ -f /root/.claude/.env.enc ]; then
  source /root/.claude/scripts/lib/decrypt-env.sh /root/.claude/.env.enc 2>/dev/null || true
fi

# デフォルトプロバイダー: ollama（最速・APIキー不要）
export MEMORY_EMBEDDING_PROVIDER="${MEMORY_EMBEDDING_PROVIDER:-ollama}"

exec npx --prefix /root/memory-lancedb-mcp tsx /root/memory-lancedb-mcp/src/index.ts
