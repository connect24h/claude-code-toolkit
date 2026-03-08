---
name: manual-generator
description: 認証画面キャプチャ→注釈付与→利用マニュアル自動生成。Playwright+Sharp+4形式出力。
trigger: "マニュアル作成", "利用マニュアル", "操作手順書", "画面キャプチャ", "manual-generator"
---

# manual-generator Skill

認証が必要なWebアプリの画面をキャプチャし、注釈付きの利用マニュアルを自動生成する。

## Trigger

- "マニュアル作成", "利用マニュアル", "操作手順書", "画面キャプチャ"
- 直接実行: `npx tsx /root/manual-generator/src/index.ts <config.yaml>`

## Process

### Step 1: YAML設定ファイル作成

ユーザーと対話して設定ファイルを作成する。

```yaml
manual:
  title: "システム名 利用マニュアル"
  version: "1.0"
  output_formats: [markdown, pptx, docx, xlsx]

auth:
  url: "https://target-app.com/login"
  steps:
    - action: fill
      selector: "#username"
      value: "${APP_USERNAME}"     # 環境変数参照
    - action: fill
      selector: "#password"
      value: "${APP_PASSWORD}"
    - action: click
      selector: "#login-button"
    - action: wait
      selector: ".dashboard"

pages:
  - id: page-id
    title: "画面タイトル"
    url: "/path"                   # または navigate で遷移
    description: "この画面の説明"
    annotations:
      - type: highlight            # 赤枠ハイライト
        selector: ".element"
        label: "ラベル"
        note: "説明テキスト"
      - type: arrow                # 矢印 + 番号
        selector: "#element"
        label: "ラベル"
        note: "説明テキスト"
      - type: number               # 番号付き丸
        selector: "#element"
        number: 1
        note: "説明テキスト"
```

### Step 2: 環境変数の設定

認証情報は環境変数で渡す（SOPS連携可）:

```bash
# 直接指定
APP_USERNAME=user APP_PASSWORD=pass npx tsx /root/manual-generator/src/index.ts config.yaml

# SOPS連携
source /root/.claude/scripts/lib/decrypt-env.sh /path/to/.env.enc
npx tsx /root/manual-generator/src/index.ts config.yaml
```

### Step 3: 実行

```bash
cd /root/manual-generator

# 全形式出力
npx tsx src/index.ts config.yaml

# 形式指定
npx tsx src/index.ts config.yaml --format markdown,pptx

# 出力先指定
npx tsx src/index.ts config.yaml --output ./my-output
```

### Step 4: 出力確認

出力先: `output/manual-YYYYMMDD/`

- `*.md` - Markdown（目次 + 画像base64埋込 + 注釈テーブル）
- `*.pptx` - PowerPoint（表紙 + 目次 + 各画面スライド）
- `*.xlsx` - Excel（目次シート + 各画面シート + 画像 + 注釈テーブル）
- `*.docx` - Word（表紙 + 目次 + 各画面 + 注釈テーブル + ヘッダー/フッター）

## Constraints

- 認証情報はYAMLに平文で書かない（環境変数 `${VAR}` を使用）
- セレクターはCSSセレクター形式（data-testid推奨）
- SPA画面は `wait` アクションで描画完了を確認
- 1設定ファイルにつき1アプリケーション

## Architecture

```
config.yaml → config-loader → capturer(Playwright) → annotator(SVG+Sharp) → generators(4形式)
```

| モジュール | 技術 |
|-----------|------|
| config-loader | js-yaml + バリデーション |
| capturer | Playwright (chromium headless) |
| annotator | SVG生成 + Sharp composite |
| markdown | テンプレートリテラル |
| pptx | PptxGenJS |
| xlsx | ExcelJS |
| docx | docx (npm) |

## Related

- プロジェクト: `/root/manual-generator/`
- サンプル設定: `/root/manual-generator/examples/sample-config.yaml`
- テスト: `cd /root/manual-generator && npm test`
