---
name: slide-style-rector
description: Marpスライドのスタイル整形。example.mdの35パターンから最適選択し、style-guideに準拠させる。Use when Marpスライドのスタイルを整形・統一する時。
trigger: "スライド作成", "スライド編集", "プレゼン", "Marp", "スタイル整形"
---

# slide-style-rector Skill

Marpスライドのスタイルを自動整形するスキル。

## Trigger

- スライド作成/編集の要求時
- "スタイル整形", "スタイルを整えて"
- `/marp` コマンド経由

## Process

### Step 1: リファレンス読み込み

1. `/opt/marp-slides/docs/style-guide.md` でデザインルールを確認
2. `/opt/marp-slides/slides/example.md` でレイアウトパターンを確認
3. `/opt/marp-slides/themes/csirt-grayscale.css` で利用可能CSSクラスを確認

### Step 2: スライド分析

1. 対象markdownファイルを読み込み
2. `---` で各スライドを分割
3. 各スライドのコンテンツタイプを分類:
   - Title / Section Break / List / Comparison / Data / Flow / KPI / SVG

### Step 3: パターン選択マトリクス

| Content Type | Item Count | Recommended Pattern |
|-------------|-----------|-------------------|
| Title | - | Pattern 1-3 |
| Section break | - | Pattern 4-7 |
| Bullet list | 1-5 | Pattern 8-11 (single column) |
| Bullet list | 6+ | Pattern 15 (2-column split) |
| Comparison | 2 items | Pattern 12 (Before/After) |
| Comparison | 3 items | Pattern 17-19 (3-column) |
| Data/Table | - | Pattern 24-26 |
| Process | 3-5 steps | Pattern 27-29 (flow) |
| KPI/Impact | 1 value | Pattern 30 (large number) |
| KPI/Impact | 3 values | Pattern 18 (3 KPI panels) |
| Summary | - | Pattern 32 (key takeaway) |
| End | - | Pattern 35 (thank you) |

### Step 4: Style Guide準拠チェック

- [ ] アクセントカラーは1スライド最大2箇所
- [ ] タイトルにコロン(:)なし
- [ ] 感嘆符(!)なし
- [ ] 装飾的絵文字なし
- [ ] 箇条書き5項目以内（超過は2カラム化）
- [ ] フォントサイズクラスが適切
- [ ] 能動態のみ

### Step 5: 出力

- 整形されたmarkdownをファイルに書き戻し
- スライドごとの変更点をレポート

## 利用可能CSSクラス

### Section Variants
`title`, `section-break`, `invert`, `compact`, `two-column`

### Layout
`grid`, `grid-cols-2`, `grid-cols-3`, `grid-cols-4`, `flex`, `flex-col`, `flex-row`

### Spacing
`gap-{2,3,4,6,8}`, `mt-{2,4,6,8}`, `mb-{2,4}`, `p-{3,4,6,8}`, `px-{4,6}`, `py-{2,4}`

### Visual
`rounded-{lg,xl,2xl}`, `shadow`, `shadow-md`, `shadow-lg`, `border-l-4`, `border-t-4`

### Color
`bg-{white,gray-50,gray-100,gray-900,navy,teal}`, `text-{navy,teal,gray-*}`, `border-{navy,teal,gray}`

### Typography
`text-em-{3xl,2xl,xl,lg,base,sm,xs}`, `font-{bold,semibold,normal}`

## Constraints

- カラーパレットから逸脱しない
- Marp front-matter directivesを維持
- スライド区切り(---)を維持
- プレゼンターノート(<!-- -->)を保持

## Related Files

- Style guide: `/opt/marp-slides/docs/style-guide.md`
- Patterns: `/opt/marp-slides/slides/example.md`
- Theme: `/opt/marp-slides/themes/csirt-grayscale.css`
