#!/bin/bash
# Slack MCP launcher - SOPS暗号化.envから復号して起動
set -e
source $HOME/.claude/scripts/lib/decrypt-env.sh $HOME/AssetFinanceApp/.env.enc
exec npx -y @modelcontextprotocol/server-slack
