#!/bin/bash
# Claude Code Statusline - コンテキスト使用量リアルタイム表示
# 設定: ~/.claude/settings.json の statusLine で有効化

set -euo pipefail

STATE_DIR="${HOME}/.claude/.statusline"
SESSION_FILE="${STATE_DIR}/session.json"
LAST_STATE_FILE="${STATE_DIR}/last_state.json"
COMPRESS_FILE="${STATE_DIR}/compress.json"
USAGE_LOG="${STATE_DIR}/usage_log.csv"

mkdir -p "$STATE_DIR"

# stdin からJSON読み込み
input=$(cat)

# --- データ抽出 ---
MODEL=$(echo "$input" | jq -r '.model.display_name // "Unknown"')
MODEL_ID=$(echo "$input" | jq -r '.model.id // "unknown"')
SESSION_ID=$(echo "$input" | jq -r '.session_id // "unknown"')
CW_SIZE=$(echo "$input" | jq -r '.context_window.context_window_size // 200000')
USED_PCT=$(echo "$input" | jq -r '.context_window.used_percentage // 0' | cut -d. -f1)
REMAIN_PCT=$(echo "$input" | jq -r '.context_window.remaining_percentage // 100' | cut -d. -f1)
TOTAL_IN=$(echo "$input" | jq -r '.context_window.total_input_tokens // 0')
TOTAL_OUT=$(echo "$input" | jq -r '.context_window.total_output_tokens // 0')
COST_USD=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
DURATION_MS=$(echo "$input" | jq -r '.cost.total_duration_ms // 0')
LINES_ADD=$(echo "$input" | jq -r '.cost.total_lines_added // 0')
LINES_DEL=$(echo "$input" | jq -r '.cost.total_lines_removed // 0')

# current_usage (null の場合があるためフォールバック)
CUR_IN=$(echo "$input" | jq -r '.context_window.current_usage.input_tokens // 0')
CUR_OUT=$(echo "$input" | jq -r '.context_window.current_usage.output_tokens // 0')
CUR_CACHE_W=$(echo "$input" | jq -r '.context_window.current_usage.cache_creation_input_tokens // 0')
CUR_CACHE_R=$(echo "$input" | jq -r '.context_window.current_usage.cache_read_input_tokens // 0')

# 現在の使用トークン数
CURRENT_USED=$((CUR_IN + CUR_CACHE_W + CUR_CACHE_R))
REMAINING=$((CW_SIZE - CURRENT_USED))
if [ "$REMAINING" -lt 0 ]; then REMAINING=0; fi

# --- 数値フォーマット ---
format_tokens() {
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

# セッション開始時刻の記録/取得
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
  # 使用量が30%以上急減した場合、圧縮と判定
  if [ "$PREV_USED" -gt 0 ] && [ "$CURRENT_USED" -gt 0 ]; then
    DROP_RATIO=$(echo "($PREV_USED - $CURRENT_USED) * 100 / $PREV_USED" | bc 2>/dev/null || echo 0)
    if [ "$DROP_RATIO" -gt 30 ]; then
      COMPRESSIONS=$((COMPRESSIONS + 1))
      echo "{\"compressions\":$COMPRESSIONS}" > "$COMPRESS_FILE"
    fi
  fi
fi

# 現在の状態を保存
echo "{\"current_used\":$CURRENT_USED,\"timestamp\":$NOW}" > "$LAST_STATE_FILE"

# --- バーンレート計算 ---
if [ "$ELAPSED" -gt 60 ] && [ "$TOTAL_IN" -gt 0 ]; then
  BURN_RATE=$(echo "$TOTAL_IN * 60 / $ELAPSED" | bc 2>/dev/null || echo 0)
  BURN_DISPLAY=$(format_tokens "$BURN_RATE")

  # 残り推定時間
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

# --- プログレスバー生成 ---
BAR_LEN=12
FILLED=$((USED_PCT * BAR_LEN / 100))
EMPTY=$((BAR_LEN - FILLED))
BAR=""
for ((i=0; i<FILLED; i++)); do BAR+="█"; done
for ((i=0; i<EMPTY; i++)); do BAR+="░"; done

# --- パフォーマンスゾーン ---
if [ "$USED_PCT" -lt 50 ]; then
  ZONE="🟢Good"
  ZONE_COLOR="\033[32m"
elif [ "$USED_PCT" -lt 70 ]; then
  ZONE="🟡Caution"
  ZONE_COLOR="\033[33m"
elif [ "$USED_PCT" -lt 90 ]; then
  ZONE="🟠Warning"
  ZONE_COLOR="\033[33m"
else
  ZONE="🔴Critical"
  ZONE_COLOR="\033[31m"
fi
RESET="\033[0m"

# --- セッション経過時間 ---
if [ "$ELAPSED" -ge 3600 ]; then
  ELAPSED_DISPLAY="$((ELAPSED / 3600))h$((ELAPSED % 3600 / 60))m"
else
  ELAPSED_DISPLAY="$((ELAPSED / 60))m"
fi

# --- コスト表示 ---
COST_DISPLAY=$(printf "\$%.2f" "$COST_USD")

# --- 使用量ログ記録 (1分ごと) ---
TODAY=$(date +%Y-%m-%d)
if [ ! -f "$USAGE_LOG" ]; then
  echo "date,input_tokens,output_tokens,cost_usd" > "$USAGE_LOG"
fi
# 今日のエントリがなければ追加、あれば更新
if grep -q "^${TODAY}," "$USAGE_LOG" 2>/dev/null; then
  sed -i "s/^${TODAY},.*/${TODAY},${TOTAL_IN},${TOTAL_OUT},${COST_USD}/" "$USAGE_LOG"
else
  echo "${TODAY},${TOTAL_IN},${TOTAL_OUT},${COST_USD}" >> "$USAGE_LOG"
fi
# 90日以上古いエントリを削除
CUTOFF=$(date -d "90 days ago" +%Y-%m-%d 2>/dev/null || date -v-90d +%Y-%m-%d 2>/dev/null || echo "")
if [ -n "$CUTOFF" ]; then
  awk -F, -v cutoff="$CUTOFF" 'NR==1 || $1 >= cutoff' "$USAGE_LOG" > "${USAGE_LOG}.tmp" && mv "${USAGE_LOG}.tmp" "$USAGE_LOG"
fi

# --- 1行目: セッション状態 ---
USED_FMT=$(format_tokens "$CURRENT_USED")
CW_FMT=$(format_tokens "$CW_SIZE")
IN_FMT=$(format_tokens "$TOTAL_IN")
OUT_FMT=$(format_tokens "$TOTAL_OUT")
REM_FMT=$(format_tokens "$REMAINING")

printf "${ZONE_COLOR}${MODEL}${RESET} ${USED_FMT}/${CW_FMT} ${BAR} ${USED_PCT}%% ${ZONE} | In:${IN_FMT} Out:${OUT_FMT} | Rem:${REM_FMT} ETA:${ETA_DISPLAY}"
if [ "$COMPRESSIONS" -gt 0 ]; then
  printf " | 🗜${COMPRESSIONS}"
fi
echo ""

# --- 2行目: 統計 ---
printf "⏱${ELAPSED_DISPLAY} | 🔥${BURN_DISPLAY}/min | 💰${COST_DISPLAY} | +${LINES_ADD}/-${LINES_DEL}lines"
if [ "$COMPRESSIONS" -gt 0 ]; then
  printf " | compact:${COMPRESSIONS}回"
fi
echo ""
