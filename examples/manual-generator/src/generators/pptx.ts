import PptxGenJS from 'pptxgenjs';
import type { ManualGenerator, AnnotatedPage, ManualConfig, OutputFormat } from '../types.js';

const COLORS = {
  navy: '1B4565',
  white: 'FFFFFF',
  lightGray: 'F7F7F7',
  text: '1A1A1A',
  subText: '666666',
} as const;

export class PptxGenerator implements ManualGenerator {
  readonly format: OutputFormat = 'pptx';
  readonly extension = '.pptx';

  async generate(pages: AnnotatedPage[], config: ManualConfig): Promise<Buffer> {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = config.manual.title;
    pptx.author = config.manual.author;

    const now = new Date().toISOString().split('T')[0];

    // 表紙スライド
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: COLORS.navy };
    titleSlide.addText(config.manual.title, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 1.5,
      fontSize: 32,
      fontFace: 'Noto Sans JP',
      color: COLORS.white,
      bold: true,
      align: 'center',
    });
    titleSlide.addText(`v${config.manual.version}  |  ${config.manual.author}  |  ${now}`, {
      x: 0.5,
      y: 3.5,
      w: 9,
      h: 0.5,
      fontSize: 14,
      fontFace: 'Noto Sans JP',
      color: COLORS.white,
      align: 'center',
    });

    // 目次スライド
    const tocSlide = pptx.addSlide();
    tocSlide.addText('目次', {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.6,
      fontSize: 24,
      fontFace: 'Noto Sans JP',
      color: COLORS.navy,
      bold: true,
    });
    const tocRows: PptxGenJS.TableRow[] = pages.map((page, i) => [
      { text: String(i + 1), options: { fontSize: 14, color: COLORS.navy, bold: true } },
      { text: page.pageConfig.title, options: { fontSize: 14, color: COLORS.text } },
    ]);
    tocSlide.addTable(tocRows, {
      x: 0.5,
      y: 1.2,
      w: 9,
      colW: [0.5, 8.5],
      border: { type: 'solid', pt: 0.5, color: COLORS.lightGray },
      rowH: 0.4,
    });

    // 各ページスライド
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const slide = pptx.addSlide();

      // タイトル
      slide.addText(`${i + 1}. ${page.pageConfig.title}`, {
        x: 0.3,
        y: 0.2,
        w: 9.4,
        h: 0.5,
        fontSize: 20,
        fontFace: 'Noto Sans JP',
        color: COLORS.navy,
        bold: true,
      });

      // スクリーンショット（左側 60%）
      const imgBase64 = page.annotatedImageBuffer.toString('base64');
      slide.addImage({
        data: `image/png;base64,${imgBase64}`,
        x: 0.3,
        y: 0.8,
        w: 5.8,
        h: 4.0,
        sizing: { type: 'contain', w: 5.8, h: 4.0 },
      });

      // 説明（右側 40%）
      slide.addText(page.pageConfig.description, {
        x: 6.3,
        y: 0.8,
        w: 3.4,
        h: 1.0,
        fontSize: 12,
        fontFace: 'Noto Sans JP',
        color: COLORS.text,
        valign: 'top',
      });

      // 注釈リスト
      if (page.resolvedAnnotations.length > 0) {
        const annTexts = page.resolvedAnnotations.map((ann) => {
          const num = ann.number ?? '-';
          const label = ann.label ? `${ann.label}: ` : '';
          return `${num}. ${label}${ann.note}`;
        });

        slide.addText(annTexts.join('\n'), {
          x: 6.3,
          y: 2.0,
          w: 3.4,
          h: 2.8,
          fontSize: 11,
          fontFace: 'Noto Sans JP',
          color: COLORS.subText,
          valign: 'top',
          paraSpaceAfter: 6,
        });
      }
    }

    // バッファとして出力
    const output = await pptx.write({ outputType: 'nodebuffer' });
    return output as Buffer;
  }
}
