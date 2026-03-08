#!/bin/bash
# Google Workspace MCP launcher - SOPS暗号化.envから復号して起動
set -e

CLAUDE_DIR="${HOME}/.claude"
source "${CLAUDE_DIR}/scripts/lib/decrypt-env.sh" "${CLAUDE_DIR}/.env.enc"

CREDS_DIR="${HOME}/.config/google-workspace-mcp"
CREDS_FILE="${CREDS_DIR}/credentials.json"
mkdir -p "$CREDS_DIR"

cat > "$CREDS_FILE" <<EOF
{
  "installed": {
    "client_id": "${GOOGLE_CLIENT_ID}",
    "client_secret": "${GOOGLE_CLIENT_SECRET}",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "redirect_uris": ["http://localhost"]
  }
}
EOF
chmod 600 "$CREDS_FILE"

exec google-workspace-mcp "$@"
