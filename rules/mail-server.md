---
name: mail-server
description: メールサーバー設定の変更ルール
---

# メールサーバー設定変更ルール

mail.example.com のメールサーバー設定は確定済み。勝手に変更しないこと。

## 変更禁止事項（ユーザーの明示的な許可なく実施しない）

### ポート・プロトコル
- SMTP送信ポートは **587 (STARTTLS)** で確定。465に変更しない
- IMAP受信ポートは **993 (SSL/TLS)** で確定
- `master.cf` の `submissions` (ポート465) はコメントアウトのまま維持

### SSL証明書
- Let's Encrypt証明書 (`/etc/letsencrypt/live/mail.example.com/`) を使用で確定
- 自己署名証明書に戻さない
- 証明書パスを変更しない
  - Dovecot: `/etc/dovecot/conf.d/10-ssl.conf`
  - Postfix: `main.cf` の `smtpd_tls_cert_file` / `smtpd_tls_key_file`

### 認証
- Dovecot PAM認証で確定。認証方式を変更しない
- `smtpd_sasl_type = dovecot` を変更しない

### OpenDKIM
- 全ドメイン `d=example.com` で署名。署名ドメインを変更しない
- DKIM秘密鍵 (`/etc/opendkim/keys/example.com/mail.private`) を変更・削除しない

## ユーザーに確認すべき変更

以下の変更を行う場合は必ずユーザーに確認を取ること：

- 新規ドメインの追加
- 新規メールアカウントの追加
- ポート構成の変更
- SSL証明書の変更
- 認証方式の変更
- Postfix `main.cf` / `master.cf` の変更
- Dovecot 設定ファイルの変更

## 確認不要の操作

- `postfix reload` / `systemctl restart dovecot`（設定反映のみ）
- 認証テスト（`doveadm auth test`）
- SSL証明書の確認（`openssl s_client`）
- ログの確認
- `postfix check` による設定チェック

## 正式ドキュメント

設定の詳細は `$HOME/mailserver/CLAUDE.md` を参照すること。
Thunderbird接続情報も同ドキュメントに記載済み。

## クライアント設定案内時の注意

Thunderbird等のクライアント設定を案内する際は、必ず以下を確認：
- SMTP: **ポート587 + STARTTLS**（465ではない）
- IMAP: **ポート993 + SSL/TLS**
- ユーザー名: `@` より前の部分のみ
