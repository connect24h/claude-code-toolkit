#!/bin/bash
# 暗号化された.envをSOPS+ageで復号し、環境変数として展開する
# Usage: source $(dirname "$0")/lib/decrypt-env.sh <encrypted-env-file>
#
# 復号結果はメモリ上のみ（一時ファイルを使わない）

SOPS_AGE_KEY_FILE="${SOPS_AGE_KEY_FILE:-$HOME/.config/sops/age/keys.txt}"
export SOPS_AGE_KEY_FILE

_decrypt_and_export() {
    local enc_file="$1"
    if [ ! -f "$enc_file" ]; then
        echo "[ERROR] 暗号化ファイルが見つかりません: $enc_file" >&2
        return 1
    fi

    local decrypted
    decrypted=$(sops --decrypt --input-type dotenv --output-type dotenv "$enc_file" 2>/dev/null)
    if [ $? -ne 0 ]; then
        echo "[ERROR] 復号失敗: $enc_file" >&2
        return 1
    fi

    # 環境変数として展開（プロセス置換でディスクに書かない）
    set -a
    eval "$decrypted"
    set +a
}

_decrypt_and_export "$1"
