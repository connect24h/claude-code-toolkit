#!/bin/bash
# Auto Summarize Script using Codex CLI
# 新規動画を自動要約するスクリプト

set -e

BASE_DIR="$HOME/iketomo_ch"
LOG_DIR="$BASE_DIR/logs"
DATE=$(date +%Y%m%d)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
LOG_FILE="$LOG_DIR/summarize_${DATE}.log"

log() {
    echo "[$TIMESTAMP] $1" | tee -a "$LOG_FILE"
}

# 要約待ちファイルを確認
PENDING_FILE="$BASE_DIR/pending_summaries/pending_${DATE}.txt"

if [ ! -f "$PENDING_FILE" ]; then
    log "要約待ちの動画はありません"
    exit 0
fi

log "=== 自動要約開始 ==="

while IFS='|' read -r UPLOAD_DATE VIDEO_ID VIDEO_TITLE; do
    log "要約作成中: $VIDEO_ID - $VIDEO_TITLE"

    # 字幕ファイルを確認
    SUBTITLE_FILE=$(find "$BASE_DIR/subtitles" -name "${UPLOAD_DATE}_${VIDEO_ID}*.vtt" | head -1)

    if [ -z "$SUBTITLE_FILE" ]; then
        log "字幕ファイルなし: $VIDEO_ID"
        continue
    fi

    # 出力ファイル名
    OUTPUT_FILE="$BASE_DIR/summaries/${UPLOAD_DATE}_${VIDEO_ID}_summary.md"

    if [ -f "$OUTPUT_FILE" ]; then
        log "既に要約あり: $VIDEO_ID"
        continue
    fi

    # Codex CLIで要約（バックグラウンド実行対応）
    PROMPT="以下のYouTube動画の字幕から詳細な要約を作成してください。

動画情報:
- 動画ID: $VIDEO_ID
- タイトル: $VIDEO_TITLE
- 公開日: $UPLOAD_DATE
- 字幕ファイル: $SUBTITLE_FILE

要約形式:
# 動画要約: $VIDEO_TITLE

## 動画情報
- 動画ID: $VIDEO_ID
- 公開日: ${UPLOAD_DATE:0:4}-${UPLOAD_DATE:4:2}-${UPLOAD_DATE:6:2}
- タイトル: $VIDEO_TITLE

## 概要
（1-2文で要約）

## トピック一覧
| # | トピック | 概要 |
|---|----------|------|
...

## 詳細タイムライン
...

## 主要な学び・洞察
...

## まとめ
...

字幕ファイルを読み込んで、上記形式で要約を作成し、$OUTPUT_FILE に保存してください。"

    # Codex CLIで実行（タイムアウト5分）
    timeout 300 codex -q "$PROMPT" 2>/dev/null || {
        log "Codex CLI実行失敗: $VIDEO_ID"
        continue
    }

    log "要約完了: $VIDEO_ID -> $OUTPUT_FILE"

    # API制限対策
    sleep 5

done < "$PENDING_FILE"

# 完了したら要約待ちファイルをアーカイブ
mv "$PENDING_FILE" "$BASE_DIR/pending_summaries/done_${DATE}.txt" 2>/dev/null || true

# 通知ファイル削除
rm -f "$BASE_DIR/PENDING_NOTIFICATION.txt"

log "=== 自動要約完了 ==="
