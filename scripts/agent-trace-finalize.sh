#!/usr/bin/env bash
# agent-trace-finalize.sh - SessionEnd hook for Agent Trace (v0.1.0)
# Finalizes trace records: adds VCS info, moves to traces/, cleans up
set -euo pipefail

# Read and pass through stdin (hook protocol)
INPUT=$(cat)
printf '%s' "$INPUT"

REGISTRY="$HOME/.claude/.agent-trace-active"
[[ -f "$REGISTRY" ]] || exit 0

while IFS= read -r CURRENT_FILE; do
    [[ -f "$CURRENT_FILE" ]] || continue

    TRACE_DIR=$(dirname "$CURRENT_FILE")
    PROJECT_ROOT=$(dirname "$TRACE_DIR")
    mkdir -p "$TRACE_DIR/traces"

    # Get git revision
    REVISION=$(git -C "$PROJECT_ROOT" rev-parse HEAD 2>/dev/null) || REVISION="unknown"

    # Extract trace ID
    TRACE_ID=$(jq -r '.id // empty' "$CURRENT_FILE" 2>/dev/null) || TRACE_ID="$(date +%s)-$$"
    [[ -z "$TRACE_ID" ]] && TRACE_ID="$(date +%s)-$$"

    # Add VCS info and write finalized trace
    jq --arg rev "$REVISION" \
       '.vcs = { type: "git", revision: $rev }' \
       "$CURRENT_FILE" > "$TRACE_DIR/traces/${TRACE_ID}.json" 2>/dev/null

    # Clean up current session file
    rm -f "$CURRENT_FILE"
done < "$REGISTRY"

# Clean up registry
rm -f "$REGISTRY"

exit 0
