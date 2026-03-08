import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  ShadingType,
} from 'docx';
import type { ManualGenerator, AnnotatedPage, ManualConfig, OutputFormat } from '../types.js';

type DocChild = Paragraph | Table;
const NAVY = '1B4565';

const BORDER_STYLE = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
  right: { style: BorderStyle.SINGLE, size: 1, color: 'E5E5E5' },
} as const;

function textCell(text: string, opts?: { bold?: boolean; color?: string }): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text,
            size: 20,
            bold: opts?.bold,
            color: opts?.color,
          }),
        ],
      }),
    ],
    borders: BORDER_STYLE,
    ...(opts?.bold ? {
      shading: { type: ShadingType.SOLID, color: NAVY, fill: NAVY },
    } : {}),
  });
}

export class DocxGenerator implements ManualGenerator {
  readonly format: OutputFormat = 'docx';
  readonly extension = '.docx';

  async generate(pages: AnnotatedPage[], config: ManualConfig): Promise<Buffer> {
    const now = new Date().toISOString().split('T')[0];

    const children: DocChild[] = [
      // 表紙
      new Paragraph({ spacing: { before: 3000 } }),
      new Paragraph({
        children: [
          new TextRun({ text: config.manual.title, bold: true, size: 56, color: NAVY }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({ spacing: { before: 400 } }),
      new Paragraph({
        children: [
          new TextRun({ text: `バージョン ${config.manual.version}`, size: 24, color: '666666' }),
        ],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `${config.manual.author}  |  ${now}`, size: 24, color: '666666' }),
        ],
        alignment: AlignmentType.CENTER,
      }),

      // 目次
      new Paragraph({ spacing: { before: 2000 } }),
      new Paragraph({
        children: [new TextRun({ text: '目次', bold: true, size: 32, color: NAVY })],
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({ spacing: { before: 200 } }),
      ...pages.map((page, i) =>
        new Paragraph({
          children: [new TextRun({ text: `${i + 1}. ${page.pageConfig.title}`, size: 22 })],
          spacing: { before: 100 },
        }),
      ),
    ];

    // 各ページ
    for (let i = 0; i < pages.length; i++) {
      children.push(...this.buildPageContent(pages[i], i));
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: config.manual.title, size: 18, color: NAVY })],
                  alignment: AlignmentType.RIGHT,
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: 'ページ ', size: 16 }),
                    new TextRun({ children: [PageNumber.CURRENT], size: 16 }),
                    new TextRun({ text: ' / ', size: 16 }),
                    new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16 }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
            }),
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return Buffer.from(buffer);
  }

  private buildPageContent(page: AnnotatedPage, index: number): DocChild[] {
    const elements: DocChild[] = [];

    elements.push(new Paragraph({ spacing: { before: 600 } }));

    // タイトル
    elements.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${index + 1}. ${page.pageConfig.title}`, bold: true, size: 28, color: NAVY }),
        ],
        heading: HeadingLevel.HEADING_2,
        spacing: { after: 200 },
      }),
    );

    // 説明
    elements.push(
      new Paragraph({
        children: [new TextRun({ text: page.pageConfig.description, size: 22 })],
        spacing: { after: 200 },
      }),
    );

    // スクリーンショット
    elements.push(
      new Paragraph({
        children: [
          new ImageRun({
            data: page.annotatedImageBuffer,
            transformation: { width: 580, height: 360 },
            type: 'png',
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 300 },
      }),
    );

    // 注釈テーブル
    if (page.resolvedAnnotations.length > 0) {
      elements.push(
        new Paragraph({
          children: [new TextRun({ text: '画面要素の説明', bold: true, size: 24, color: NAVY })],
          spacing: { before: 200, after: 100 },
        }),
      );

      const headerRow = new TableRow({
        children: ['#', '種別', '要素', '説明'].map(
          (t) => textCell(t, { bold: true, color: 'FFFFFF' }),
        ),
      });

      const dataRows = page.resolvedAnnotations.map((ann) => {
        const typeLabel = ann.type === 'highlight' ? 'ハイライト' : ann.type === 'arrow' ? '矢印' : '番号';
        return new TableRow({
          children: [
            textCell(String(ann.number ?? '-')),
            textCell(typeLabel),
            textCell(ann.label ?? '-'),
            textCell(ann.note),
          ],
        });
      });

      elements.push(
        new Table({
          rows: [headerRow, ...dataRows],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }),
      );
    }

    return elements;
  }
}
