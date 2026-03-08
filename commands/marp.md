---
description: Marpスライド作成ワークフロー。トピック指定で新規作成、fixでレイアウト修正、svgで図表作成。
---

# /marp Command

Marpスライド作成のエントリーポイント。

## Usage

```
/marp <topic>            トピックからスライド新規作成
/marp fix <file>         既存スライドのレイアウト修正
/marp svg <description>  SVG図表を作成
```

## Workflow: New Slide (`/marp <topic>`)

### Step 1: Planning
1. トピックを分析
2. スライド構成（10-15枚）を提案
3. ユーザー確認を待つ

### Step 2: Generation
1. `/opt/marp-slides/slides/<topic-kebab-case>.md` を作成
2. Front matter を設定:
   ```yaml
   ---
   marp: true
   theme: csirt-grayscale
   paginate: true
   header: '<topic>'
   footer: 'CSIRT | 2026'
   ---
   ```
3. `slide-style-rector` スキルを適用
   - `/opt/marp-slides/slides/example.md` からパターンを選択
   - `/opt/marp-slides/docs/style-guide.md` のルールに準拠
4. テキストルール厳守（CLAUDE.md参照）

### Step 3: Validation
1. `layout-fix` スキルでレイアウト検証
   - Playwright MCPでスクリーンショット
   - 視覚的問題を検出・修正

### Step 4: Build
```bash
cd /opt/marp-slides && npm run build
```

### Step 5: Output
- HTML: `/opt/marp-slides/output/<topic>.html`
- PDF: `cd /opt/marp-slides && npm run pdf`

## Workflow: Fix Mode (`/marp fix <file>`)

1. 対象ファイルを読み込み
2. `layout-fix` スキルを実行
3. 修正結果をレポート

## Workflow: SVG Mode (`/marp svg <description>`)

1. `svg-creator` スキルを呼び出し
2. SVGを `/opt/marp-slides/assets/` に保存
3. スライドへの挿入コードを提示

## Reference Files

- Design system: `/opt/marp-slides/docs/style-guide.md`
- Layout patterns: `/opt/marp-slides/slides/example.md`
- Theme CSS: `/opt/marp-slides/themes/csirt-grayscale.css`
- Project rules: `/opt/marp-slides/CLAUDE.md`

## Text Rules (ENFORCED)

- タイトルにコロン不使用
- 感嘆符・疑問符禁止（見出し）
- 装飾的絵文字禁止
- 1スライド1メッセージ
- 箇条書き5項目以内
- アクセントカラー1スライド最大2箇所
