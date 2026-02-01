#!/bin/bash
# YouTube Channel Daily Observer Script
# 毎日の定点観測スクリプト

set -e

# 設定
BASE_DIR="/root/iketomo_ch"
LOG_DIR="$BASE_DIR/logs"
CONFIG_FILE="$BASE_DIR/config/channels.json"
DATE=$(date +%Y%m%d)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# ログディレクトリ作成
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/observe_${DATE}.log"

log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

log "=== 定点観測開始 ==="

# チャンネルリストを取得
CHANNELS=$(jq -r '.channels[] | select(.enabled == true) | .id + "|" + .url + "|" + .output_dir' "$CONFIG_FILE")

for channel_info in $CHANNELS; do
    IFS='|' read -r CHANNEL_ID CHANNEL_URL OUTPUT_DIR <<< "$channel_info"

    log "チャンネル処理中: $CHANNEL_ID"

    # ディレクトリ作成
    mkdir -p "$OUTPUT_DIR/subtitles"
    mkdir -p "$OUTPUT_DIR/video_metadata"
    mkdir -p "$OUTPUT_DIR/pending_summaries"

    # 最新10本の動画情報を取得
    log "動画リスト取得中..."
    yt-dlp --flat-playlist -j "$CHANNEL_URL/videos" 2>/dev/null | head -10 | while read -r video_json; do
        VIDEO_ID=$(echo "$video_json" | jq -r '.id')
        VIDEO_TITLE=$(echo "$video_json" | jq -r '.title')

        # 既存チェック（字幕または要約ファイルがあればスキップ）
        EXISTING_SUB=$(find "$OUTPUT_DIR/subtitles" -name "*_${VIDEO_ID}*" 2>/dev/null | head -1)
        EXISTING_SUM=$(find "$OUTPUT_DIR/summaries" -name "*_${VIDEO_ID}*" 2>/dev/null | head -1)
        if [ -n "$EXISTING_SUB" ] || [ -n "$EXISTING_SUM" ]; then
            # 既に処理済み - スキップ
            continue
        fi

        # 動画の詳細情報取得（日付含む）
        log "新規動画検出: $VIDEO_ID - $VIDEO_TITLE"

        UPLOAD_DATE=$(yt-dlp --skip-download --print "%(upload_date)s" "https://www.youtube.com/watch?v=$VIDEO_ID" 2>/dev/null || echo "unknown")

        if [ "$UPLOAD_DATE" = "unknown" ]; then
            log "日付取得失敗: $VIDEO_ID"
            continue
        fi

        # 字幕ダウンロード
        log "字幕ダウンロード中: $VIDEO_ID"
        yt-dlp --write-auto-sub --sub-lang ja --skip-download \
            -o "$OUTPUT_DIR/subtitles/${UPLOAD_DATE}_${VIDEO_ID}" \
            "https://www.youtube.com/watch?v=$VIDEO_ID" 2>/dev/null || {
            log "字幕ダウンロード失敗: $VIDEO_ID"
            continue
        }

        # 要約待ちリストに追加
        echo "${UPLOAD_DATE}|${VIDEO_ID}|${VIDEO_TITLE}" >> "$OUTPUT_DIR/pending_summaries/pending_${DATE}.txt"

        log "完了: $VIDEO_ID ($UPLOAD_DATE)"

        # API制限対策で少し待機
        sleep 2
    done

    log "チャンネル完了: $CHANNEL_ID"
done

# 要約待ちファイルの確認
PENDING_COUNT=$(cat "$BASE_DIR/pending_summaries/pending_${DATE}.txt" 2>/dev/null | wc -l || echo 0)
log "本日の新規動画: ${PENDING_COUNT}本"

log "=== 定点観測完了 ==="

# 要約待ちがある場合は通知ファイル作成
if [ "$PENDING_COUNT" -gt 0 ]; then
    echo "新規動画 ${PENDING_COUNT}本 が要約待ちです。" > "$BASE_DIR/PENDING_NOTIFICATION.txt"
    echo "詳細: $BASE_DIR/pending_summaries/pending_${DATE}.txt" >> "$BASE_DIR/PENDING_NOTIFICATION.txt"
    echo "Claude Codeで /youtube-observe iketomo-ch today を実行してください。" >> "$BASE_DIR/PENDING_NOTIFICATION.txt"
fi
