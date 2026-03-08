#!/usr/bin/env bash
# Claude Code Statusline - コンテキスト使用量リアルタイム表示
# 設定: ~/.claude/settings.json の statusLine で有効化

set -euo pipefail
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

STATE_DIR="${HOME}/.claude/.statusline"
SESSION_FILE="${STATE_DIR}/session.json"
LAST_STATE_FILE="${STATE_DIR}/last_state.json"
COMPRESS_FILE="${STATE_DIR}/compress.json"
USAGE_LOG="${STATE_DIR}/usage_log.csv"

mkdir -p "$STATE_DIR"

# stdin からJSON読み込み
input=$(cat)

# --- データ抽出 (jq呼び出しを1回に最適化) ---
eval "$(echo "$input" | jq -r '
  "MODEL=\"\(.model.display_name // "Unknown")\"",
  "MODEL_ID=\"\(.model.id // "unknown")\"",
  "SESSION_ID=\"\(.session_id // "unknown")\"",
  "CW_SIZE=\(.context_window.context_window_size // 200000)",
  "USED_PCT=\(.context_window.used_percentage // 0 | floor)",
  "REMAIN_PCT=\(.context_window.remaining_percentage // 100 | floor)",
  "TOTAL_IN=\(.context_window.total_input_tokens // 0)",
  "TOTAL_OUT=\(.context_window.total_output_tokens // 0)",
  "COST_USD=\(.cost.total_cost_usd // 0)",
  "DURATION_MS=\(.cost.total_duration_ms // 0)",
  "LINES_ADD=\(.cost.total_lines_added // 0)",
  "LINES_DEL=\(.cost.total_lines_removed // 0)",
  "CUR_IN=\(.context_window.current_usage.input_tokens // 0)",
  "CUR_OUT=\(.context_window.current_usage.output_tokens // 0)",
  "CUR_CACHE_W=\(.context_window.current_usage.cache_creation_input_tokens // 0)",
  "CUR_CACHE_R=\(.context_window.current_usage.cache_read_input_tokens // 0)"
' 2>/dev/null)" || {
  echo "statusline: parse error"
  exit 0
}

# 現在の使用トークン数
CURRENT_USED=$((CUR_IN + CUR_CACHE_W + CUR_CACHE_R))
REMAINING=$((CW_SIZE - CURRENT_USED))
if [ "$REMAINING" -lt 0 ]; then REMAINING=0; fi

# --- 数値フォーマット ---
fmt() {
  local n=$1
  if [ "$n" -ge 1000000 ]; then
    printf "%.1fM" "$(echo "$n / 1000000" | bc -l)"
  elif [ "$n" -ge 1000 ]; then
    printf "%.1fk" "$(echo "$n / 1000" | bc -l)"
  else
    echo "$n"
  fi
}

# --- セッション管理 ---
NOW=$(date +%s)

if [ ! -f "$SESSION_FILE" ] || [ "$(jq -r '.session_id' "$SESSION_FILE" 2>/dev/null)" != "$SESSION_ID" ]; then
  echo "{\"session_id\":\"$SESSION_ID\",\"start_time\":$NOW}" > "$SESSION_FILE"
  echo "{\"compressions\":0}" > "$COMPRESS_FILE"
fi
START_TIME=$(jq -r '.start_time' "$SESSION_FILE" 2>/dev/null || echo "$NOW")
ELAPSED=$((NOW - START_TIME))
if [ "$ELAPSED" -lt 1 ]; then ELAPSED=1; fi

# --- 圧縮検出 ---
COMPRESSIONS=$(jq -r '.compressions // 0' "$COMPRESS_FILE" 2>/dev/null || echo 0)
if [ -f "$LAST_STATE_FILE" ]; then
  PREV_USED=$(jq -r '.current_used // 0' "$LAST_STATE_FILE" 2>/dev/null || echo 0)
  if [ "$PREV_USED" -gt 0 ] && [ "$CURRENT_USED" -gt 0 ]; then
    DROP_RATIO=$(echo "($PREV_USED - $CURRENT_USED) * 100 / $PREV_USED" | bc 2>/dev/null || echo 0)
    if [ "$DROP_RATIO" -gt 30 ]; then
      COMPRESSIONS=$((COMPRESSIONS + 1))
      echo "{\"compressions\":$COMPRESSIONS}" > "$COMPRESS_FILE"
    fi
  fi
fi
echo "{\"current_used\":$CURRENT_USED,\"timestamp\":$NOW}" > "$LAST_STATE_FILE"

# --- バーンレート ---
if [ "$ELAPSED" -gt 60 ] && [ "$TOTAL_IN" -gt 0 ]; then
  BURN_RATE=$(echo "$TOTAL_IN * 60 / $ELAPSED" | bc 2>/dev/null || echo 0)
  BURN_DISPLAY=$(fmt "$BURN_RATE")
  if [ "$BURN_RATE" -gt 0 ] && [ "$REMAINING" -gt 0 ]; then
    ETA_MIN=$(echo "$REMAINING / $BURN_RATE" | bc 2>/dev/null || echo 0)
    if [ "$ETA_MIN" -ge 60 ]; then
      ETA_DISPLAY="$(echo "$ETA_MIN / 60" | bc)h$(echo "$ETA_MIN % 60" | bc)m"
    else
      ETA_DISPLAY="${ETA_MIN}m"
    fi
  else
    ETA_DISPLAY="--"
  fi
else
  BURN_DISPLAY="--"
  ETA_DISPLAY="--"
fi

# --- プログレスバー (ASCII安全文字) ---
BAR_LEN=12
FILLED=$((USED_PCT * BAR_LEN / 100))
EMPTY=$((BAR_LEN - FILLED))
BAR=""
for ((i=0; i<FILLED; i++)); do BAR+="#"; done
for ((i=0; i<EMPTY; i++)); do BAR+="-"; done

# --- パフォーマンスゾーン (ANSI色のみ、絵文字なし) ---
# ANSI色定義
C_GREEN=$'\033[32m'
C_YELLOW=$'\033[33m'
C_RED=$'\033[31m'
C_CYAN=$'\033[36m'
C_DIM=$'\033[2m'
C_BOLD=$'\033[1m'
C_RESET=$'\033[0m'

if [ "$USED_PCT" -lt 50 ]; then
  ZONE_ICON="[OK]"
  ZONE_LABEL="Good"
  ZC=$C_GREEN
elif [ "$USED_PCT" -lt 70 ]; then
  ZONE_ICON="[!!]"
  ZONE_LABEL="Caution"
  ZC=$C_YELLOW
elif [ "$USED_PCT" -lt 90 ]; then
  ZONE_ICON="[!!]"
  ZONE_LABEL="Warning"
  ZC=$C_YELLOW
else
  ZONE_ICON="[XX]"
  ZONE_LABEL="Critical"
  ZC=$C_RED
fi

# --- 経過時間 ---
if [ "$ELAPSED" -ge 3600 ]; then
  ELAPSED_DISPLAY="$((ELAPSED / 3600))h$((ELAPSED % 3600 / 60))m"
else
  ELAPSED_DISPLAY="$((ELAPSED / 60))m"
fi

# --- コスト ---
COST_DISPLAY=$(printf "\$%.2f" "$COST_USD")

# --- 使用量ログ ---
TODAY=$(date +%Y-%m-%d)
if [ ! -f "$USAGE_LOG" ]; then
  echo "date,input_tokens,output_tokens,cost_usd" > "$USAGE_LOG"
fi
if grep -q "^${TODAY}," "$USAGE_LOG" 2>/dev/null; then
  sed -i "s/^${TODAY},.*/${TODAY},${TOTAL_IN},${TOTAL_OUT},${COST_USD}/" "$USAGE_LOG"
else
  echo "${TODAY},${TOTAL_IN},${TOTAL_OUT},${COST_USD}" >> "$USAGE_LOG"
fi
CUTOFF=$(date -d "90 days ago" +%Y-%m-%d 2>/dev/null || date -v-90d +%Y-%m-%d 2>/dev/null || echo "")
if [ -n "$CUTOFF" ]; then
  awk -F, -v cutoff="$CUTOFF" 'NR==1 || $1 >= cutoff' "$USAGE_LOG" > "${USAGE_LOG}.tmp" && mv "${USAGE_LOG}.tmp" "$USAGE_LOG"
fi

# --- 出力 (echo -n + 変数で構築、printfのフォーマット解釈問題を回避) ---
USED_FMT=$(fmt "$CURRENT_USED")
CW_FMT=$(fmt "$CW_SIZE")
IN_FMT=$(fmt "$TOTAL_IN")
OUT_FMT=$(fmt "$TOTAL_OUT")
REM_FMT=$(fmt "$REMAINING")

# 1行目: セッション状態
LINE1="${ZC}${C_BOLD}${MODEL}${C_RESET}"
LINE1+=" ${USED_FMT}/${CW_FMT} ${ZC}[${BAR}]${C_RESET} ${USED_PCT}%"
LINE1+=" ${ZC}${ZONE_ICON}${ZONE_LABEL}${C_RESET}"
LINE1+=" ${C_DIM}|${C_RESET} In:${C_CYAN}${IN_FMT}${C_RESET} Out:${C_CYAN}${OUT_FMT}${C_RESET}"
LINE1+=" ${C_DIM}|${C_RESET} Rem:${C_GREEN}${REM_FMT}${C_RESET} ETA:${ETA_DISPLAY}"
if [ "$COMPRESSIONS" -gt 0 ]; then
  LINE1+=" ${C_DIM}|${C_RESET} ${C_YELLOW}compact:${COMPRESSIONS}${C_RESET}"
fi

# 2行目: 統計
LINE2="${C_DIM}T:${C_RESET}${ELAPSED_DISPLAY}"
LINE2+=" ${C_DIM}|${C_RESET} ${C_DIM}Burn:${C_RESET}${BURN_DISPLAY}/min"
LINE2+=" ${C_DIM}|${C_RESET} ${C_DIM}Cost:${C_RESET}${COST_DISPLAY}"
LINE2+=" ${C_DIM}|${C_RESET} ${C_GREEN}+${LINES_ADD}${C_RESET}/${C_RED}-${LINES_DEL}${C_RESET}lines"

echo -e "$LINE1"
echo -e "$LINE2"
