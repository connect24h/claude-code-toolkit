---
description: Compass Dashboardの株価をWebスクレイピングで更新する。
---

# /update-compass-prices スキル

Compass Dashboardの株価データを外部サイトからスクレイピングして更新します。

## 使用方法

```
/update-compass-prices           # 全銘柄を更新
/update-compass-prices NVDA AAPL # 特定銘柄のみ更新
```

## 実行内容

1. **Google Financeからスクレイピング**で最新価格を取得
2. データベースの`price_cache`テーブルを更新
3. 24時間キャッシュとして保存

## 実装

```bash
# 全ウォッチリスト銘柄を一括更新（推奨）
curl -X POST "http://localhost:8000/api/realtime/update-all" | jq

# 特定銘柄のみ更新
curl -s "http://localhost:8000/api/realtime/prices?symbols=NVDA,AAPL&force_refresh=true" | jq

# デフォルト銘柄を更新
curl -s "http://localhost:8000/api/realtime/prices?force_refresh=true" | jq
```

## ウォッチリスト銘柄

### 米国株
NVDA, AAPL, MSFT, GOOGL, AMZN, TSLA, META, PLTR, APP, AVGO, CRWD, SNOW, MDB, DDOG

### ETF
SPY, QQQ, FXI, EPI, YINN, SMH

### 指数
^GSPC (S&P 500), ^DJI (Dow), ^IXIC (NASDAQ), ^VIX

### 日本株
6857.T, 9984.T, 9983.T, ^N225, ^TOPIX

### コモディティ
GC=F (Gold), CL=F (Oil), DX-Y.NYB (Dollar Index)

## 自動スケジュール

バックエンドで以下の時間に自動更新:
- 08:30 JST - 日本市場開始前
- 15:30 JST - 日本市場終了後
- 23:00 JST - 米国市場開始前
- 06:00 JST - 米国市場終了後

## トラブルシューティング

### 価格が取得できない場合

1. バックエンドログを確認:
```bash
pm2 logs compass-backend --lines 50
```

2. APIを直接テスト:
```bash
curl -s "http://localhost:8000/api/realtime/prices?symbols=NVDA&force_refresh=true"
```

3. スクレイピング元サイトの確認:
- Google Finance: https://www.google.com/finance/quote/NVDA:NASDAQ
