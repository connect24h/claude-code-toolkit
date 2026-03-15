#!/usr/bin/env bash
# activity-log.sh - Centralized activity logger for Claude Code hooks
# Usage: activity-log.sh <subcommand>
#   tool-use     - Log Edit/Write from PostToolUse hook (reads stdin JSON)
#   session-end  - Log session summary from SessionEnd hook (reads stdin JSON)
set -euo pipefail

LOG_DIR="$HOME/.claude/logs"
LOG_FILE="$LOG_DIR/activity.log"
SESSION_FILE="$LOG_DIR/.session-start"
MAX_LOG_SIZE=$((10 * 1024 * 1024))  # 10MB

mkdir -p "$LOG_DIR"

# Read and pass through stdin (hook protocol)
INPUT=$(cat)
printf '%s' "$INPUT"

SUBCOMMAND="${1:-}"
TIMESTAMP=$(date -Iseconds 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S+00:00")

# Log rotation: compress if >10MB
rotate_log() {
    if [[ -f "$LOG_FILE" ]]; then
        local size
        size=$(stat -c%s "$LOG_FILE" 2>/dev/null) || return 0
        if [[ "$size" -gt "$MAX_LOG_SIZE" ]]; then
            local archive="$LOG_DIR/activity-$(date +%Y%m%d-%H%M%S).log.gz"
            gzip -c "$LOG_FILE" > "$archive" 2>/dev/null
            : > "$LOG_FILE"
            # Remove archives older than 30 days
            find "$LOG_DIR" -name "activity-*.log.gz" -mtime +30 -delete 2>/dev/null || true
        fi
    fi
}

case "$SUBCOMMAND" in
    tool-use)
        TOOL_NAME=$(printf '%s' "$INPUT" | jq -r '.tool_name // .tool // empty' 2>/dev/null) || exit 0
        FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null) || exit 0
        [[ -z "$TOOL_NAME" || -z "$FILE_PATH" ]] && exit 0

        # Get relative path if in a git repo
        PROJECT_ROOT=$(git -C "$(dirname "$FILE_PATH")" rev-parse --show-toplevel 2>/dev/null) || PROJECT_ROOT=""
        if [[ -n "$PROJECT_ROOT" ]]; then
            REL_PATH=$(realpath --relative-to="$PROJECT_ROOT" "$FILE_PATH" 2>/dev/null) || REL_PATH="$FILE_PATH"
        else
            REL_PATH=$(basename "$FILE_PATH")
        fi

        # Calculate line info for Edit
        LINE_INFO=""
        if [[ "$TOOL_NAME" == "Edit" ]]; then
            NEW_STRING=$(printf '%s' "$INPUT" | jq -r '.tool_input.new_string // empty' 2>/dev/null) || true
            if [[ -n "$NEW_STRING" && -f "$FILE_PATH" ]]; then
                NEW_LINES=$(printf '%s' "$NEW_STRING" | wc -l)
                NEW_LINES=$((NEW_LINES + 1))
                FIRST_LINE=$(printf '%s' "$NEW_STRING" | head -1)
                if [[ -n "$FIRST_LINE" ]]; then
                    START=$(grep -n -F -m1 -- "$FIRST_LINE" "$FILE_PATH" 2>/dev/null | head -1 | cut -d: -f1) || START="?"
                    if [[ -n "$START" && "$START" != "?" ]]; then
                        END=$((START + NEW_LINES - 1))
                        LINE_INFO=" lines:${START}-${END}"
                    fi
                fi
            fi
        elif [[ "$TOOL_NAME" == "Write" && -f "$FILE_PATH" ]]; then
            TOTAL=$(wc -l < "$FILE_PATH" 2>/dev/null) || TOTAL=0
            LINE_INFO=" lines:1-${TOTAL}"
        fi

        # Create session start marker if not exists
        [[ ! -f "$SESSION_FILE" ]] && echo "$TIMESTAMP" > "$SESSION_FILE"

        rotate_log
        echo "[$TIMESTAMP] [claude-code] [$TOOL_NAME] ${REL_PATH}${LINE_INFO}" >> "$LOG_FILE"
        ;;

    session-end)
        if [[ -f "$SESSION_FILE" ]]; then
            SESSION_START=$(cat "$SESSION_FILE" 2>/dev/null) || SESSION_START=""
            if [[ -n "$SESSION_START" ]]; then
                START_EPOCH=$(date -d "$SESSION_START" +%s 2>/dev/null) || START_EPOCH=0
                END_EPOCH=$(date +%s)
                if [[ "$START_EPOCH" -gt 0 ]]; then
                    DURATION_SEC=$((END_EPOCH - START_EPOCH))
                    DURATION_MIN=$((DURATION_SEC / 60))
                    DURATION_LABEL="${DURATION_MIN}m"
                else
                    DURATION_LABEL="unknown"
                fi
            else
                DURATION_LABEL="unknown"
            fi

            # Count edits in this session
            EDIT_COUNT=0
            if [[ -f "$LOG_FILE" && -n "$SESSION_START" ]]; then
                EDIT_COUNT=$(grep -c "\[claude-code\] \[Edit\]\|\[claude-code\] \[Write\]" "$LOG_FILE" 2>/dev/null) || EDIT_COUNT=0
            fi

            echo "[$TIMESTAMP] [claude-code] [session-end] duration:${DURATION_LABEL} edits:${EDIT_COUNT}" >> "$LOG_FILE"
            rm -f "$SESSION_FILE"
        else
            echo "[$TIMESTAMP] [claude-code] [session-end] duration:unknown" >> "$LOG_FILE"
        fi
        ;;

    *)
        exit 0
        ;;
esac

exit 0
