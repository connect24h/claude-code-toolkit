#!/bin/bash
# Mail-to-Slack 起動ラッパー
# SOPS暗号化.envを一時的に復号し、実行後に削除する
set -e

APP_DIR="/root/mail-to-slack"
ENV_FILE="$APP_DIR/.env"
ENC_FILE="$APP_DIR/.env.enc"

# 復号して.envを生成
export SOPS_AGE_KEY_FILE="/root/.config/sops/age/keys.txt"
sops --decrypt --input-type dotenv --output-type dotenv "$ENC_FILE" > "$ENV_FILE"
chmod 600 "$ENV_FILE"

# 終了時に.envを確実に削除
cleanup() {
    rm -f "$ENV_FILE"
}
trap cleanup EXIT INT TERM

# .envの読み込みとアプリ実行
cd "$APP_DIR"
set -a
source "$ENV_FILE"
set +a
npx tsx src/index.ts
