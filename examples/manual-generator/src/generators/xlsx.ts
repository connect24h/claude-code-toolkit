import ExcelJS from 'exceljs';
import type { ManualGenerator, AnnotatedPage, ManualConfig, OutputFormat } from '../types.js';

const HEADER_FILL: ExcelJS.FillPattern = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF1B4565' },
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  color: { argb: 'FFFFFFFF' },
  bold: true,
  size: 11,
};

export class XlsxGenerator implements ManualGenerator {
  readonly format: OutputFormat = 'xlsx';
  readonly extension = '.xlsx';

  async generate(pages: AnnotatedPage[], config: ManualConfig): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = config.manual.author;
    workbook.created = new Date();

    const now = new Date().toISOString().split('T')[0];

    // シート1: 目次
    const tocSheet = workbook.addWorksheet('目次');
    tocSheet.columns = [
      { header: '#', key: 'num', width: 5 },
      { header: 'ページID', key: 'id', width: 20 },
      { header: 'タイトル', key: 'title', width: 40 },
      { header: '説明', key: 'description', width: 60 },
    ];

    // ヘッダースタイル
    const headerRow = tocSheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = HEADER_FILL;
      cell.font = HEADER_FONT;
    });

    // メタ情報
    tocSheet.addRow([]);
    tocSheet.addRow(['', 'タイトル', config.manual.title]);
    tocSheet.addRow(['', 'バージョン', config.manual.version]);
    tocSheet.addRow(['', '作成者', config.manual.author]);
    tocSheet.addRow(['', '作成日', now]);
    tocSheet.addRow([]);

    // 目次データ
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      tocSheet.addRow([i + 1, page.pageConfig.id, page.pageConfig.title, page.pageConfig.description]);
    }

    // 各ページのシート
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const sheetName = `${i + 1}_${page.pageConfig.id}`.slice(0, 31);
      const sheet = workbook.addWorksheet(sheetName);

      // タイトル行
      sheet.mergeCells('A1:E1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = `${i + 1}. ${page.pageConfig.title}`;
      titleCell.font = { size: 16, bold: true, color: { argb: 'FF1B4565' } };

      // 説明行
      sheet.mergeCells('A2:E2');
      const descCell = sheet.getCell('A2');
      descCell.value = page.pageConfig.description;
      descCell.font = { size: 11 };

      // スクリーンショット画像
      const imageId = workbook.addImage({
        buffer: Buffer.from(page.annotatedImageBuffer) as never,
        extension: 'png',
      });
      sheet.addImage(imageId, {
        tl: { col: 0, row: 3 },
        ext: { width: 640, height: 400 },
      });

      // 注釈テーブル（画像の下）
      const tableStartRow = 28;
      if (page.resolvedAnnotations.length > 0) {
        const annHeaderRow = sheet.getRow(tableStartRow);
        const headers = ['#', '種別', '要素', '説明'];
        headers.forEach((h, ci) => {
          const cell = annHeaderRow.getCell(ci + 1);
          cell.value = h;
          cell.fill = HEADER_FILL;
          cell.font = HEADER_FONT;
        });

        for (let j = 0; j < page.resolvedAnnotations.length; j++) {
          const ann = page.resolvedAnnotations[j];
          const typeLabel = ann.type === 'highlight' ? 'ハイライト' : ann.type === 'arrow' ? '矢印' : '番号';
          sheet.getRow(tableStartRow + 1 + j).values = [
            ann.number ?? j + 1,
            typeLabel,
            ann.label ?? '-',
            ann.note,
          ];
        }
      }

      // 列幅設定
      sheet.getColumn(1).width = 5;
      sheet.getColumn(2).width = 12;
      sheet.getColumn(3).width = 20;
      sheet.getColumn(4).width = 50;
      sheet.getColumn(5).width = 20;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
