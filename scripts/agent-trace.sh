#!/usr/bin/env bash
# agent-trace.sh - PostToolUse hook for Agent Trace (v0.1.0)
# Records AI code attribution when Edit/Write tools are used
set -euo pipefail

# Read and pass through stdin (hook protocol)
INPUT=$(cat)
printf '%s' "$INPUT"

# Extract tool name and file path
TOOL_NAME=$(printf '%s' "$INPUT" | jq -r '.tool_name // .tool // empty' 2>/dev/null) || exit 0
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null) || exit 0
[[ -z "$FILE_PATH" || -z "$TOOL_NAME" ]] && exit 0
[[ ! -f "$FILE_PATH" ]] && exit 0

# Find git root (skip non-git directories)
PROJECT_ROOT=$(git -C "$(dirname "$FILE_PATH")" rev-parse --show-toplevel 2>/dev/null) || exit 0

# Setup trace directory
TRACE_DIR="$PROJECT_ROOT/.agent-trace"
CURRENT_FILE="$TRACE_DIR/current.json"
REGISTRY="$HOME/.claude/.agent-trace-active"
mkdir -p "$TRACE_DIR/traces"

# Calculate relative path
REL_PATH=$(realpath --relative-to="$PROJECT_ROOT" "$FILE_PATH" 2>/dev/null) || REL_PATH="$FILE_PATH"

# Calculate line range
if [[ "$TOOL_NAME" == "Write" ]]; then
    START_LINE=1
    TOTAL_LINES=$(wc -l < "$FILE_PATH" 2>/dev/null) || TOTAL_LINES=1
    END_LINE=$((TOTAL_LINES > 0 ? TOTAL_LINES : 1))
elif [[ "$TOOL_NAME" == "Edit" ]]; then
    NEW_STRING=$(printf '%s' "$INPUT" | jq -r '.tool_input.new_string // empty' 2>/dev/null) || exit 0
    if [[ -z "$NEW_STRING" ]]; then
        exit 0
    fi
    NEW_LINE_COUNT=$(printf '%s' "$NEW_STRING" | wc -l)
    NEW_LINE_COUNT=$((NEW_LINE_COUNT + 1))
    FIRST_LINE_TEXT=$(printf '%s' "$NEW_STRING" | head -1)
    if [[ -n "$FIRST_LINE_TEXT" ]]; then
        START_LINE=$(grep -n -F -m1 -- "$FIRST_LINE_TEXT" "$FILE_PATH" 2>/dev/null | head -1 | cut -d: -f1) || START_LINE=1
    else
        START_LINE=1
    fi
    [[ -z "$START_LINE" ]] && START_LINE=1
    END_LINE=$((START_LINE + NEW_LINE_COUNT - 1))
else
    exit 0
fi

TIMESTAMP=$(date -Iseconds 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S+00:00")

# Initialize or update current.json
if [[ ! -f "$CURRENT_FILE" ]]; then
    SESSION_ID=$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen 2>/dev/null || printf '%s' "$(date +%s)-$$")
    jq -n \
        --arg version "0.1.0" \
        --arg id "$SESSION_ID" \
        --arg timestamp "$TIMESTAMP" \
        --arg path "$REL_PATH" \
        --argjson start "$START_LINE" \
        --argjson end "$END_LINE" \
        '{
            version: $version,
            id: $id,
            timestamp: $timestamp,
            tool: { name: "claude-code", version: "1.0.0" },
            files: [{
                path: $path,
                conversations: [{
                    contributor: { type: "ai", model_id: "anthropic/claude-opus-4-6" },
                    ranges: [{ start_line: $start, end_line: $end }]
                }]
            }]
        }' > "$CURRENT_FILE"
else
    HAS_FILE=$(jq --arg path "$REL_PATH" '[.files[] | select(.path == $path)] | length' "$CURRENT_FILE" 2>/dev/null) || HAS_FILE=0
    if [[ "$HAS_FILE" -gt 0 ]]; then
        jq --arg path "$REL_PATH" \
           --argjson start "$START_LINE" \
           --argjson end "$END_LINE" \
           '(.files[] | select(.path == $path) | .conversations[0].ranges) += [{ start_line: $start, end_line: $end }]' \
           "$CURRENT_FILE" > "$CURRENT_FILE.tmp" && mv "$CURRENT_FILE.tmp" "$CURRENT_FILE"
    else
        jq --arg path "$REL_PATH" \
           --argjson start "$START_LINE" \
           --argjson end "$END_LINE" \
           '.files += [{
                path: $path,
                conversations: [{
                    contributor: { type: "ai", model_id: "anthropic/claude-opus-4-6" },
                    ranges: [{ start_line: $start, end_line: $end }]
                }]
            }]' \
           "$CURRENT_FILE" > "$CURRENT_FILE.tmp" && mv "$CURRENT_FILE.tmp" "$CURRENT_FILE"
    fi
fi

# Register for session finalization
grep -qxF "$CURRENT_FILE" "$REGISTRY" 2>/dev/null || echo "$CURRENT_FILE" >> "$REGISTRY"

exit 0
