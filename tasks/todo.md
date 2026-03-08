# Mail-to-Slack + Teams-to-Calendar

## 概要
hamamoto@sharedsecurity.co.jp 宛メールを定期チェック → Slack通知 + Teamsスケジュール → Googleカレンダー登録

## 計画

### Phase 1: プロジェクト基盤
- [ ] package.json, tsconfig.json セットアップ
- [ ] 型定義 (types.ts)
- [ ] 設定管理 (config.ts) - SOPS暗号化.env対応
- [ ] run.sh (SOPS復号 → 実行 → 削除)

### Phase 2: IMAP メール取得
- [ ] imap-client.ts - IMAP接続 (port 993 SSL/TLS)
- [ ] mail-parser.ts - メール解析 (From/Subject/Date/Body)
- [ ] state管理 - 既読UID追跡 (data/last-uid.json)

### Phase 3: Slack通知
- [ ] slack.ts - 新着メール一覧をSlackに投稿
- [ ] フォーマット: 差出人・件名・日時・本文要約

### Phase 4: Teams会議→Googleカレンダー
- [ ] teams-parser.ts - Teams会議招待メールのパース (ICS/本文)
- [ ] calendar.ts - Google Calendar API書き込み
- [ ] Google Calendar書き込み権限の追加 (GOOGLE_WORKSPACE_READ_ONLY=false → 再認証)

### Phase 5: 統合・Cron
- [ ] index.ts - メインオーケストレーター
- [ ] Cron登録 (5分間隔)
- [ ] systemdまたはcron設定

## 検証
- [ ] テスト通過 (Vitest)
- [ ] 実際のメール取得テスト
- [ ] Slack投稿テスト
- [ ] Teamsメール→カレンダー登録テスト
