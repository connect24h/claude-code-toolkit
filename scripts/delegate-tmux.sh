#!/usr/bin/env bash
# delegate-tmux.sh - Run Codex/Gemini CLI in visible tmux panes
# Usage: delegate-tmux.sh <codex|gemini> "task description"
#        delegate-tmux.sh --no-tmux <codex|gemini> "task description"
set -euo pipefail

LOG_FILE="$HOME/.claude/logs/activity.log"
SESSION="claude-delegates"
NO_TMUX=false

# Parse --no-tmux flag
if [[ "${1:-}" == "--no-tmux" ]]; then
    NO_TMUX=true
    shift
fi

CLI="${1:-}"
TASK="${2:-}"

if [[ -z "$CLI" || -z "$TASK" ]]; then
    echo "Usage: delegate-tmux.sh [--no-tmux] <codex|gemini> \"task\"" >&2
    exit 1
fi

TIMESTAMP=$(date -Iseconds 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S+00:00")
TASK_SHORT=$(echo "$TASK" | head -c 60)

# Build CLI command
case "$CLI" in
    codex)
        CLI_CMD="codex exec \"${TASK}\""
        AGENT_NAME="codex-cli"
        ;;
    gemini)
        CLI_CMD="gemini \"${TASK}\""
        AGENT_NAME="gemini-cli"
        ;;
    *)
        echo "Error: Unknown CLI '$CLI'. Use 'codex' or 'gemini'." >&2
        exit 1
        ;;
esac

# Log delegation start
mkdir -p "$(dirname "$LOG_FILE")"
echo "[$TIMESTAMP] [$AGENT_NAME] [delegated] ${TASK_SHORT}" >> "$LOG_FILE"

# Fallback: run directly without tmux
if [[ "$NO_TMUX" == true ]] || ! command -v tmux >/dev/null 2>&1; then
    echo "[delegate] Running $CLI directly (no tmux)..."
    eval "$CLI_CMD"
    EXIT_CODE=$?
    TIMESTAMP_END=$(date -Iseconds 2>/dev/null || date -u +"%Y-%m-%dT%H:%M:%S+00:00")
    echo "[$TIMESTAMP_END] [$AGENT_NAME] [completed] exit:${EXIT_CODE} ${TASK_SHORT}" >> "$LOG_FILE"
    exit $EXIT_CODE
fi

# Create delegates session if not exists
if ! tmux has-session -t "$SESSION" 2>/dev/null; then
    tmux new-session -d -s "$SESSION" -x 200 -y 50
    tmux set-option -t "$SESSION" pane-border-status top
    tmux set-option -t "$SESSION" pane-border-format " #[fg=cyan]#{window_name}#[default]: #{pane_title} "
    tmux set-option -t "$SESSION" status-left "#[fg=magenta][Delegates] "
    tmux set-option -t "$SESSION" status-right "#[fg=yellow]%H:%M"
    # First window is already created, rename it
    WINDOW_NAME="${CLI}-1"
    tmux rename-window -t "$SESSION:0" "$WINDOW_NAME"
else
    # Find next window number for this CLI
    EXISTING=$(tmux list-windows -t "$SESSION" -F "#{window_name}" 2>/dev/null | grep "^${CLI}-" | wc -l) || EXISTING=0
    NEXT=$((EXISTING + 1))
    WINDOW_NAME="${CLI}-${NEXT}"
    tmux new-window -t "$SESSION" -n "$WINDOW_NAME"
fi

# Set pane title to task description
tmux select-pane -t "$SESSION:${WINDOW_NAME}" -T "$TASK_SHORT" 2>/dev/null || true

# Run CLI command in the tmux pane, then log completion
COMPLETION_CMD="TIMESTAMP_END=\$(date -Iseconds 2>/dev/null); echo \"[\$TIMESTAMP_END] [$AGENT_NAME] [completed] exit:\$? ${TASK_SHORT}\" >> \"$LOG_FILE\""
tmux send-keys -t "$SESSION:${WINDOW_NAME}" "$CLI_CMD; $COMPLETION_CMD" C-m

echo "[delegate] Task sent to tmux session '$SESSION' window '$WINDOW_NAME'"
echo "[delegate] Attach with: tmux attach -t $SESSION"

exit 0
