#!/usr/bin/env bash
# dashboard-update.sh - Generate/update project dashboard (.claude-dashboard.md)
# Called from PostToolUse hook or manually
# Usage: dashboard-update.sh [--session-end]
set -euo pipefail

LOG_FILE="$HOME/.claude/logs/activity.log"
SESSION_FILE="$HOME/.claude/logs/.session-start"
DEBOUNCE_FILE="/tmp/.claude-dashboard-debounce"
DEBOUNCE_SEC=2

# Read and pass through stdin (hook protocol)
INPUT=$(cat)
printf '%s' "$INPUT"

# Determine project root from hook input or current directory
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null) || FILE_PATH=""
if [[ -n "$FILE_PATH" && -e "$FILE_PATH" ]]; then
    PROJECT_ROOT=$(git -C "$(dirname "$FILE_PATH")" rev-parse --show-toplevel 2>/dev/null) || exit 0
else
    PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
fi

[[ -z "$PROJECT_ROOT" ]] && exit 0

DASHBOARD="$PROJECT_ROOT/.claude-dashboard.md"
TRACE_FILE="$PROJECT_ROOT/.agent-trace/current.json"

# Debounce: skip if updated within last N seconds
if [[ -f "$DEBOUNCE_FILE" ]]; then
    LAST_UPDATE=$(stat -c%Y "$DEBOUNCE_FILE" 2>/dev/null) || LAST_UPDATE=0
    NOW=$(date +%s)
    if [[ $((NOW - LAST_UPDATE)) -lt "$DEBOUNCE_SEC" ]]; then
        exit 0
    fi
fi
touch "$DEBOUNCE_FILE"

NOW=$(date -Iseconds 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S+00:00")
NOW_SHORT=$(date +"%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "$NOW")
PROJECT_NAME=$(basename "$PROJECT_ROOT")

# Calculate session duration
SESSION_DURATION="N/A"
if [[ -f "$SESSION_FILE" ]]; then
    SESSION_START=$(cat "$SESSION_FILE" 2>/dev/null) || SESSION_START=""
    if [[ -n "$SESSION_START" ]]; then
        START_EPOCH=$(date -d "$SESSION_START" +%s 2>/dev/null) || START_EPOCH=0
        NOW_EPOCH=$(date +%s)
        if [[ "$START_EPOCH" -gt 0 ]]; then
            DURATION_SEC=$((NOW_EPOCH - START_EPOCH))
            DURATION_MIN=$((DURATION_SEC / 60))
            SESSION_DURATION="${DURATION_MIN}m"
        fi
    fi
fi

# --- Collect Agent Status ---
CODEX_STATUS="Idle"
CODEX_TASK="-"
GEMINI_STATUS="Idle"
GEMINI_TASK="-"

CODEX_PID=$(pgrep -f "codex" 2>/dev/null | head -1) || CODEX_PID=""
if [[ -n "$CODEX_PID" ]]; then
    CODEX_STATUS="Running (PID:${CODEX_PID})"
    CODEX_TASK=$(ps -p "$CODEX_PID" -o args= 2>/dev/null | head -c 80) || CODEX_TASK="(active)"
fi

GEMINI_PID=$(pgrep -f "gemini" 2>/dev/null | head -1) || GEMINI_PID=""
if [[ -n "$GEMINI_PID" ]]; then
    GEMINI_STATUS="Running (PID:${GEMINI_PID})"
    GEMINI_TASK=$(ps -p "$GEMINI_PID" -o args= 2>/dev/null | head -c 80) || GEMINI_TASK="(active)"
fi

# --- Collect Recent Changes from Agent Trace ---
CHANGES_TABLE=""
if [[ -f "$TRACE_FILE" ]]; then
    CHANGES_TABLE=$(jq -r '
        .files[]? |
        .path as $path |
        .conversations[]?.ranges[]? |
        "| " + $path + " | " + (.start_line|tostring) + "-" + (.end_line|tostring) + " |"
    ' "$TRACE_FILE" 2>/dev/null | head -10) || CHANGES_TABLE=""
fi

# --- Session Statistics ---
EDIT_COUNT=0
WRITE_COUNT=0
DELEGATION_COUNT=0
if [[ -f "$LOG_FILE" ]]; then
    EDIT_COUNT=$(grep -c "\[Edit\]" "$LOG_FILE" 2>/dev/null) || EDIT_COUNT=0
    WRITE_COUNT=$(grep -c "\[Write\]" "$LOG_FILE" 2>/dev/null) || WRITE_COUNT=0
    DELEGATION_COUNT=$(grep -c "\[delegated\]" "$LOG_FILE" 2>/dev/null) || DELEGATION_COUNT=0
fi
TOTAL_EDITS=$((EDIT_COUNT + WRITE_COUNT))

# Count unique files from trace
FILE_COUNT=0
if [[ -f "$TRACE_FILE" ]]; then
    FILE_COUNT=$(jq '.files | length' "$TRACE_FILE" 2>/dev/null) || FILE_COUNT=0
fi

# --- Last 5 Log Entries ---
LOG_ENTRIES=""
if [[ -f "$LOG_FILE" ]]; then
    LOG_ENTRIES=$(tail -5 "$LOG_FILE" 2>/dev/null) || LOG_ENTRIES=""
fi

# --- Generate Dashboard ---
{
    echo "# Claude Code Dashboard"
    echo ""
    echo "**Updated**: ${NOW_SHORT} | **Session**: ${SESSION_DURATION} | **Project**: ${PROJECT_NAME}"
    echo ""
    echo "---"
    echo ""
    echo "## Active Agents"
    echo ""
    echo "| Agent | Status | Task |"
    echo "|-------|--------|------|"
    echo "| Claude Code (Opus 4.6) | Active | Working |"
    echo "| Codex CLI | ${CODEX_STATUS} | ${CODEX_TASK} |"
    echo "| Gemini CLI | ${GEMINI_STATUS} | ${GEMINI_TASK} |"
    echo ""
    echo "## Recent Changes"
    echo ""
    if [[ -n "$CHANGES_TABLE" ]]; then
        echo "| File | Lines |"
        echo "|------|-------|"
        echo "$CHANGES_TABLE"
    else
        echo "_No changes tracked yet_"
    fi
    echo ""
    echo "## Session Stats"
    echo ""
    echo "Edits: ${EDIT_COUNT} | Writes: ${WRITE_COUNT} | Files: ${FILE_COUNT} | Delegations: ${DELEGATION_COUNT}"
    echo ""
    echo "## Recent Log"
    echo ""
    if [[ -n "$LOG_ENTRIES" ]]; then
        echo '```'
        echo "$LOG_ENTRIES"
        echo '```'
    else
        echo "_No log entries yet_"
    fi
} > "$DASHBOARD"

exit 0
