# mail-to-slack

hamamoto@sharedsecurity.co.jp 宛メールを定期チェック → Slack通知 + Teams会議 → Googleカレンダー登録。

## 技術スタック

- **言語**: TypeScript (ES2022+, strict mode)
- **ランタイム**: Node.js + tsx
- **テスト**: Vitest
- **IMAP**: imapflow (SSL/TLS, port 993)
- **メール解析**: mailparser
- **Slack**: @slack/web-api (Block Kit)
- **Google Calendar**: googleapis (OAuth2)

## ディレクトリ構成

```
src/
├── index.ts          # メインオーケストレーター
├── config.ts         # 設定管理
├── types.ts          # 型定義
├── imap-client.ts    # IMAP接続・メール取得
├── teams-parser.ts   # Teams会議招待パース (ICS/本文)
├── slack.ts          # Slack通知 (Block Kit)
├── calendar.ts       # Google Calendar書き込み
└── state.ts          # 既読UID状態管理
scripts/
└── google-auth.ts    # Google OAuth再認証スクリプト
data/
└── last-uid.json     # 最終処理UID（自動生成）
```

## コマンド

```bash
./run.sh              # SOPS復号 → 実行（本番用）
npm test              # テスト実行
npm run typecheck     # 型チェック
```

## デプロイ

- Cron: 5分間隔で `run.sh` を実行
- Slack: #all-claude-code-manager (C0AH8CMPEL8)
- Google Calendar: connect24h.now@gmail.com

## 注意事項

- IMAP: `imap.sharedsecurity.co.jp` はGMOサーバー、TLS証明書検証スキップが必要
- Google Calendar: 書き込み権限が必要（calendar.readonlyでは不可）
- 権限不足時: `npx tsx scripts/google-auth.ts` で再認証
- .env.enc: SOPS+age暗号化。平文.envは一時的にのみ存在
