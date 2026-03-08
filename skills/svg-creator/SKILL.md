---
name: svg-creator
description: スライド用SVG図表を作成。Navy/Teal/Grayscaleカラーパレット使用、2:5比率。
trigger: "SVG作成", "図表作成", "ダイアグラム", "フロー図", "svg-creator"
---

# svg-creator Skill

スライド用のSVG図表を生成するスキル。

## Trigger

- "SVG作成", "図表作成", "ダイアグラム", "フロー図"
- `/marp svg <description>` 経由

## Specifications

### Size and Ratio

- 基本比率: 2:5 (width:height)
- デフォルト: 400px x 1000px
- 大サイズ: 600px x 1500px
- 小サイズ: 300px x 750px

### Color Palette (STRICT)

| Color | Hex | Role |
|-------|-----|------|
| Navy | #1B4565 | 主要要素、ヘッダー、ボーダー |
| Teal | #3E9BA4 | 補助要素、ハイライト、矢印 |
| Near Black | #1A1A1A | テキスト、ラベル |
| Charcoal | #333333 | セカンダリテキスト |
| Dark Gray | #666666 | アノテーション |
| Mid Gray | #E5E5E5 | ボーダー、区切り線 |
| Light Gray | #F7F7F7 | 背景フィル |
| White | #FFFFFF | 背景、コントラスト |

### Output

- ディレクトリ: `/opt/marp-slides/assets/`
- 命名: kebab-case (例: `incident-response-flow.svg`)
- SVG内に `<!-- Description: ... -->` コメント記載

## Diagram Types

| Type | Description | Layout |
|------|-------------|--------|
| Flow | プロセス/ワークフロー | 上→下ボックス+矢印 |
| Hierarchy | 組織図/ツリー | ネストされたレベル |
| Timeline | 時系列 | 縦タイムライン+ノード |
| Comparison | 並列比較 | 平行カラム |
| Architecture | システム構成 | 層構造+接続線 |
| Matrix | 2D分類 | グリッドセル |
| Funnel | 絞り込み | 台形シェイプ |

## SVG Template

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 1000">
  <defs>
    <marker id="arrowhead" markerWidth="10" markerHeight="7"
            refX="10" refY="3.5" orient="auto">
      <polygon points="0 0, 10 3.5, 0 7" fill="#1B4565"/>
    </marker>
    <style>
      .title { font: bold 20px 'Noto Sans JP', sans-serif; fill: #1A1A1A; }
      .label { font: 16px 'Noto Sans JP', sans-serif; fill: #333333; }
      .note  { font: 12px 'Noto Sans JP', sans-serif; fill: #666666; }
      .box-navy { fill: #1B4565; rx: 8; }
      .box-teal { fill: #3E9BA4; rx: 8; }
      .box-gray { fill: #F7F7F7; stroke: #E5E5E5; stroke-width: 1; rx: 8; }
      .line { stroke: #1B4565; stroke-width: 2; }
      .line-teal { stroke: #3E9BA4; stroke-width: 2; }
    </style>
  </defs>
  <!-- SVG content here -->
</svg>
```

## Process

### Step 1: 要件理解
- 何を可視化するか
- 図表タイプ（flow, hierarchy, timeline等）
- 統合先スライドのコンテキスト

### Step 2: SVG設計
- テンプレートからDiagram Type選択
- 要素数に応じてサイズ調整
- カラーパレット適用

### Step 3: SVG生成
- インラインSVG（外部依存なし）
- `<text>` 要素のみ使用（foreignObject不使用）
- stroke-width: 主要線2px、詳細線1px
- 角丸矩形 (rx="8") でモダンな外観

### Step 4: スライド統合

Markdown記法:
```markdown
![description](./assets/filename.svg)
```

HTML記法（精密サイズ指定）:
```html
<div style="text-align:center; margin-top:1rem;">
  <img src="./assets/filename.svg" alt="description" style="max-height:70vh;">
</div>
```

## Constraints

- 外部画像生成APIは使用しない
- SVG内にラスター画像を埋め込まない
- 純粋なSVGマークアップのみ
- 日本語テキストはfont-familyフォールバックで対応
- カラーパレットからの逸脱禁止

## Related

- Patterns: `/opt/marp-slides/slides/example.md` (Pattern 33-34)
- Style guide: `/opt/marp-slides/docs/style-guide.md`
