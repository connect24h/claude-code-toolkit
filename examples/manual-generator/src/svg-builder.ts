import type { ResolvedAnnotation, BoundingBox } from './types.js';

// 注釈カラーパレット
const COLORS = {
  highlight: '#E53935',
  arrow: '#1B4565',
  number: '#1B4565',
  numberBg: '#1B4565',
  numberText: '#FFFFFF',
  labelBg: 'rgba(255, 255, 255, 0.9)',
  labelText: '#1A1A1A',
  labelBorder: '#E5E5E5',
} as const;

const FONT_FAMILY = "'Noto Sans JP', 'Hiragino Sans', sans-serif";
const NUMBER_CIRCLE_R = 14;
const LABEL_FONT_SIZE = 13;
const LABEL_PADDING = 6;
const ARROW_HEAD_SIZE = 8;

/** ハイライト枠（赤い角丸矩形） */
function buildHighlight(ann: ResolvedAnnotation): string {
  const { x, y, width, height } = ann.boundingBox;
  const pad = 4;
  const lines: string[] = [
    `<rect x="${x - pad}" y="${y - pad}" width="${width + pad * 2}" height="${height + pad * 2}" rx="4" ry="4" fill="none" stroke="${COLORS.highlight}" stroke-width="3" stroke-dasharray="none"/>`,
  ];
  if (ann.label) {
    lines.push(buildLabel(ann.label, x - pad, y - pad - 24));
  }
  return lines.join('\n');
}

/** 矢印 + ラベル */
function buildArrow(ann: ResolvedAnnotation): string {
  const { x, y, width, height } = ann.boundingBox;
  const centerX = x + width / 2;
  const topY = y;

  // 矢印は要素の上に伸びる
  const arrowStartY = topY - 50;
  const arrowEndY = topY - 6;

  const lines: string[] = [
    // 矢印の線
    `<line x1="${centerX}" y1="${arrowStartY}" x2="${centerX}" y2="${arrowEndY}" stroke="${COLORS.arrow}" stroke-width="2"/>`,
    // 矢印の先端
    `<polygon points="${centerX - ARROW_HEAD_SIZE / 2},${arrowEndY - ARROW_HEAD_SIZE} ${centerX + ARROW_HEAD_SIZE / 2},${arrowEndY - ARROW_HEAD_SIZE} ${centerX},${arrowEndY}" fill="${COLORS.arrow}"/>`,
  ];

  // 番号付き丸
  if (ann.number !== undefined) {
    lines.push(buildNumberCircle(ann.number, centerX, arrowStartY - NUMBER_CIRCLE_R - 2));
  }

  // ラベル
  if (ann.label) {
    const labelX = centerX + NUMBER_CIRCLE_R + 8;
    const labelY = arrowStartY - NUMBER_CIRCLE_R - 2;
    lines.push(buildLabel(ann.label, labelX, labelY - LABEL_FONT_SIZE / 2));
  }

  return lines.join('\n');
}

/** 番号付き丸 + ラベル */
function buildNumber(ann: ResolvedAnnotation): string {
  const { x, y, width } = ann.boundingBox;
  const circleX = x + width + NUMBER_CIRCLE_R + 6;
  const circleY = y + ann.boundingBox.height / 2;
  const num = ann.number ?? 1;

  const lines: string[] = [
    buildNumberCircle(num, circleX, circleY),
  ];

  if (ann.label) {
    lines.push(buildLabel(ann.label, circleX + NUMBER_CIRCLE_R + 8, circleY - LABEL_FONT_SIZE / 2));
  }

  return lines.join('\n');
}

/** 番号付き丸を生成 */
function buildNumberCircle(num: number, cx: number, cy: number): string {
  return [
    `<circle cx="${cx}" cy="${cy}" r="${NUMBER_CIRCLE_R}" fill="${COLORS.numberBg}"/>`,
    `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="${COLORS.numberText}" font-size="12" font-weight="bold" font-family="${FONT_FAMILY}">${num}</text>`,
  ].join('\n');
}

/** ラベル背景 + テキスト */
function buildLabel(text: string, x: number, y: number): string {
  const charWidth = LABEL_FONT_SIZE * 0.7;
  const textWidth = text.length * charWidth;
  const bgWidth = textWidth + LABEL_PADDING * 2;
  const bgHeight = LABEL_FONT_SIZE + LABEL_PADDING * 2;

  return [
    `<rect x="${x}" y="${y}" width="${bgWidth}" height="${bgHeight}" rx="3" fill="${COLORS.labelBg}" stroke="${COLORS.labelBorder}" stroke-width="1"/>`,
    `<text x="${x + LABEL_PADDING}" y="${y + LABEL_PADDING + LABEL_FONT_SIZE * 0.85}" fill="${COLORS.labelText}" font-size="${LABEL_FONT_SIZE}" font-family="${FONT_FAMILY}">${escapeXml(text)}</text>`,
  ].join('\n');
}

/** XML特殊文字エスケープ */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 注釈1つをSVG要素に変換 */
function buildAnnotationSvg(ann: ResolvedAnnotation): string {
  switch (ann.type) {
    case 'highlight':
      return buildHighlight(ann);
    case 'arrow':
      return buildArrow(ann);
    case 'number':
      return buildNumber(ann);
  }
}

/** 全注釈をSVGドキュメントとして生成 */
export function buildAnnotationsSvg(
  annotations: ResolvedAnnotation[],
  width: number,
  height: number,
): string {
  const elements = annotations.map(buildAnnotationSvg).join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
${elements}
</svg>`;
}
