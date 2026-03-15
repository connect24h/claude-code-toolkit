#!/usr/bin/env bash
# tmux-monitor.sh - Real-time monitoring dashboard via tmux
# Usage: tmux-monitor.sh [start|stop|refresh] [PROJECT_PATH]
set -euo pipefail

COMMAND="${1:-start}"
PROJECT_PATH="${2:-$(pwd)}"

# Resolve project root
if git -C "$PROJECT_PATH" rev-parse --show-toplevel >/dev/null 2>&1; then
    PROJECT_ROOT=$(git -C "$PROJECT_PATH" rev-parse --show-toplevel)
else
    PROJECT_ROOT="$PROJECT_PATH"
fi

PROJECT_NAME=$(basename "$PROJECT_ROOT")
SESSION="claude-monitor-${PROJECT_NAME}"
LOG_FILE="$HOME/.claude/logs/activity.log"
DASHBOARD="$PROJECT_ROOT/.claude-dashboard.md"

# Check tmux availability
if ! command -v tmux >/dev/null 2>&1; then
    echo "Error: tmux is not installed" >&2
    exit 1
fi

case "$COMMAND" in
    start)
        # If session exists, attach to it
        if tmux has-session -t "$SESSION" 2>/dev/null; then
            echo "Attaching to existing session: $SESSION"
            tmux attach-session -t "$SESSION"
            exit 0
        fi

        echo "Creating monitor session: $SESSION"

        # Create session with dashboard pane
        tmux new-session -d -s "$SESSION" -c "$PROJECT_ROOT" -x 200 -y 50

        # Pane 0: Dashboard (auto-refresh)
        tmux send-keys -t "$SESSION:0.0" \
            "watch -n 2 -t 'cat \"$DASHBOARD\" 2>/dev/null || echo \"Dashboard not yet generated. Edit a file to trigger.\"'" C-m

        # Split bottom 30%
        tmux split-window -t "$SESSION:0" -v -p 30 -c "$PROJECT_ROOT"

        # Pane 1: Activity log
        tmux send-keys -t "$SESSION:0.1" \
            "touch \"$LOG_FILE\" && tail -n 50 -f \"$LOG_FILE\"" C-m

        # Split bottom-right 50%
        tmux split-window -t "$SESSION:0.1" -h -p 50 -c "$PROJECT_ROOT"

        # Pane 2: Recent file changes
        tmux send-keys -t "$SESSION:0.2" \
            "watch -n 2 -t 'echo \"=== Recent File Changes ===\"; echo \"\"; if [ -d \"$PROJECT_ROOT/src\" ]; then ls -lhrt \"$PROJECT_ROOT/src/\" 2>/dev/null | tail -15; else ls -lhrt \"$PROJECT_ROOT/\" 2>/dev/null | tail -15; fi; echo \"\"; echo \"=== Agent Trace ===\"; if [ -f \"$PROJECT_ROOT/.agent-trace/current.json\" ]; then jq -r \".files[].path\" \"$PROJECT_ROOT/.agent-trace/current.json\" 2>/dev/null; else echo \"No trace data\"; fi'" C-m

        # Set pane titles (tmux 3.5a)
        tmux select-pane -t "$SESSION:0.0" -T "Dashboard"
        tmux select-pane -t "$SESSION:0.1" -T "Activity Log"
        tmux select-pane -t "$SESSION:0.2" -T "Files & Trace"

        # Enable pane border titles
        tmux set-option -t "$SESSION" pane-border-status top
        tmux set-option -t "$SESSION" pane-border-format " #[fg=green]#{pane_index}#[default]: #{pane_title} "

        # Status bar customization
        tmux set-option -t "$SESSION" status-left "#[fg=cyan][Monitor] "
        tmux set-option -t "$SESSION" status-right "#[fg=yellow]#{session_name} #[default]| %H:%M"

        # Focus on dashboard pane
        tmux select-pane -t "$SESSION:0.0"

        # Attach
        tmux attach-session -t "$SESSION"
        ;;

    stop)
        if tmux has-session -t "$SESSION" 2>/dev/null; then
            tmux kill-session -t "$SESSION"
            echo "Stopped monitor session: $SESSION"
        else
            echo "No active monitor session: $SESSION"
        fi
        ;;

    refresh)
        # Trigger dashboard update
        rm -f /tmp/.claude-dashboard-debounce
        echo '{}' | bash "$HOME/.claude/scripts/dashboard-update.sh" > /dev/null 2>&1
        echo "Dashboard refreshed: $DASHBOARD"
        ;;

    *)
        echo "Usage: tmux-monitor.sh [start|stop|refresh] [PROJECT_PATH]" >&2
        exit 1
        ;;
esac

exit 0
