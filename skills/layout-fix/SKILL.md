---
name: layout-fix
description: Playwright MCPでスライドをスクリーンショットし、レイアウト崩れを検出・自動修正する。
trigger: "レイアウト修正", "レイアウト崩れ", "はみ出し", "見切れ", "layout-fix"
---

# layout-fix Skill

Playwright MCPを使ったスライドレイアウト自動修正スキル。

## Trigger

- "レイアウト修正", "レイアウト崩れ", "はみ出し", "見切れ"
- `/marp fix <file>` 経由

## Prerequisites

- Playwright MCP が設定済み（project: /root/.mcp.json）
- @marp-team/marp-cli がインストール済み（/opt/marp-slides/）

## Process

### Step 1: HTMLビルド

```bash
cd /opt/marp-slides
npx @marp-team/marp-cli --html <target.md> -o /tmp/marp-screenshots/preview.html
```

### Step 2: Playwright MCPでスクリーンショット

1. `browser_navigate` で `file:///tmp/marp-screenshots/preview.html` を開く
2. 各スライド（`#<page-number>` でナビゲーション）をスクリーンショット
3. スクリーンショット画像を分析

### Step 3: 視覚的問題の検出

各スクリーンショットで以下をチェック:

| 問題 | 検出方法 |
|------|---------|
| 下部はみ出し | コンテンツがスライド境界を超えている |
| テキスト密集 | 要素間の間隔が狭すぎる |
| 過剰な余白 | レイアウトが活用されていない |
| カラム不整合 | カラムの高さや位置がずれている |
| フォント不適切 | テキストが小さすぎる/大きすぎる |

### Step 4: 修正パターン

| Problem | Fix |
|---------|-----|
| 下部はみ出し | gap/margin/paddingを削減、または2スライドに分割 |
| 5+縦項目 | 2カラムグリッド化 (grid-cols-2) |
| テキスト密集 | compact sectionクラス適用、gap増加 |
| 過剰余白 | フォントサイズクラスを上げる、パネル追加 |
| テキスト見切れ | フォントサイズクラスを下げる (text-em-xl → text-em-lg) |

### Step 5: イテレーション（最大3回）

1. 修正をmarkdownに適用
2. HTMLを再ビルド
3. 修正スライドを再スクリーンショット
4. 問題が解消されたか確認
5. 未解消なら再修正（最大3回）

### Step 6: クリーンアップ

```bash
rm -rf /tmp/marp-screenshots
```

## 検出ヒューリスティクス

- 1リスト内の `<li>` が5個超 → 2カラム変換フラグ
- gap/margin値 > 2rem かつ overflow → 1remに削減
- コンテンツの視覚的高さ > スライド高さの80% → overflow警告

## Related Skills

- `slide-style-rector`: 構造の正確性を先に確保
- `svg-creator`: 図表のリサイズが必要な場合

## Related Files

- Screenshot helper: `/opt/marp-slides/scripts/take-screenshots.sh`
- Theme: `/opt/marp-slides/themes/csirt-grayscale.css`
