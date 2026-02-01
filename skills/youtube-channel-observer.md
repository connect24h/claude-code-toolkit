# YouTube Channel Observer Skill

YouTubeチャンネルを定点観測し、内容を要約するスキル。

## 使用方法

```
/youtube-observe [channel] [period]
```

### パラメータ
- `channel`: チャンネルID（例: iketomo-ch）または "all"
- `period`: 期間指定（例: 2026-01, 2025-10-to-2026-01, last_month, last_week）

### 例
```
/youtube-observe iketomo-ch 2026-01
/youtube-observe iketomo-ch 2025-10-to-2026-02
/youtube-observe all last_month
```

## 処理フロー

1. **動画リスト取得**: yt-dlpで指定期間の動画一覧を取得
2. **字幕ダウンロード**: 日本語字幕をダウンロード
3. **要約作成**: Codex CLIサブエージェントで各動画を要約
4. **統合レポート**: 全体まとめを作成
5. **関連調査**: 必要に応じて関連情報を調査

## 出力ファイル形式

```
/root/[channel_dir]/
├── config/
│   └── channels.json          # チャンネル設定
├── summaries/
│   └── YYYYMMDD_[video_id]_summary.md  # 個別要約
├── subtitles/
│   └── YYYYMMDD_[video_id].vtt         # 字幕ファイル
├── reports/
│   └── YYYYMM_monthly_report.md        # 月次レポート
└── video_index.md              # 動画インデックス
```

## 設定ファイル

`/root/iketomo_ch/config/channels.json` でチャンネルを管理。

### チャンネル追加方法
```json
{
  "channels": [
    {
      "id": "channel-id",
      "name": "チャンネル名",
      "url": "https://www.youtube.com/@channel-id",
      "description": "チャンネル説明",
      "output_dir": "/root/channel_dir",
      "enabled": true
    }
  ]
}
```

## 実行コマンド

### 手動実行
このスキルを呼び出すと、Claude Codeがオーケストレーターとして:
1. 対象動画を特定
2. Codex CLIサブエージェントに字幕取得・要約を委譲
3. 結果を統合してレポート作成
4. 進捗をファイルに記録

### Codex CLI委譲テンプレート

```
yt-dlpで以下の動画の字幕を取得し、内容を要約してください:
- 動画ID: [VIDEO_ID]
- タイトル: [TITLE]
- 公開日: [DATE]

要約形式:
1. 動画概要（1-2文）
2. トピック一覧（表形式）
3. 詳細タイムライン
4. 主要な学び・洞察
5. まとめ

出力先: /root/[channel]/summaries/YYYYMMDD_[VIDEO_ID]_summary.md
```
