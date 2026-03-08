import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { MarkdownGenerator } from '../src/generators/markdown.js';
import { PptxGenerator } from '../src/generators/pptx.js';
import { XlsxGenerator } from '../src/generators/xlsx.js';
import { DocxGenerator } from '../src/generators/docx.js';
import { getGenerator } from '../src/generators/index.js';
import type { AnnotatedPage, ManualConfig, ResolvedAnnotation } from '../src/types.js';

async function createTestData(): Promise<{ config: ManualConfig; pages: AnnotatedPage[] }> {
  const testPng = await sharp({
    create: { width: 200, height: 150, channels: 4, background: { r: 200, g: 200, b: 200, alpha: 1 } },
  }).png().toBuffer();

  const annotations: ResolvedAnnotation[] = [
    {
      type: 'highlight',
      selector: '.menu',
      note: 'メニューエリア',
      label: 'メニュー',
      boundingBox: { x: 10, y: 10, width: 80, height: 30 },
    },
    {
      type: 'number',
      selector: '#btn',
      note: 'ボタン説明',
      number: 1,
      label: '保存ボタン',
      boundingBox: { x: 100, y: 50, width: 60, height: 25 },
    },
  ];

  const config: ManualConfig = {
    manual: {
      title: 'テストマニュアル',
      version: '1.0',
      author: 'テスト作成者',
      output_formats: ['markdown', 'pptx', 'xlsx', 'docx'],
    },
    auth: {
      url: 'https://example.com/login',
      steps: [],
    },
    pages: [
      {
        id: 'dashboard',
        title: 'ダッシュボード',
        description: 'テスト説明文です',
        annotations: annotations.map(({ boundingBox, ...rest }) => rest),
      },
    ],
  };

  const pages: AnnotatedPage[] = [
    {
      pageConfig: config.pages[0],
      annotatedImageBuffer: testPng,
      originalImageBuffer: testPng,
      resolvedAnnotations: annotations,
    },
  ];

  return { config, pages };
}

describe('MarkdownGenerator', () => {
  it('Markdown形式で出力できる', async () => {
    const { config, pages } = await createTestData();
    const gen = new MarkdownGenerator();

    expect(gen.format).toBe('markdown');
    expect(gen.extension).toBe('.md');

    const buffer = await gen.generate(pages, config);
    const md = buffer.toString('utf-8');

    expect(md).toContain('# テストマニュアル');
    expect(md).toContain('## 目次');
    expect(md).toContain('ダッシュボード');
    expect(md).toContain('テスト説明文です');
    expect(md).toContain('data:image/png;base64,');
    expect(md).toContain('| # | 種別 | 要素 | 説明 |');
    expect(md).toContain('メニュー');
    expect(md).toContain('保存ボタン');
  });
});

describe('PptxGenerator', () => {
  it('PPTX形式で出力できる', async () => {
    const { config, pages } = await createTestData();
    const gen = new PptxGenerator();

    expect(gen.format).toBe('pptx');
    expect(gen.extension).toBe('.pptx');

    const buffer = await gen.generate(pages, config);

    // PPTXはZIP形式（先頭バイトがPK）
    expect(buffer[0]).toBe(0x50); // P
    expect(buffer[1]).toBe(0x4B); // K
    expect(buffer.length).toBeGreaterThan(1000);
  });
});

describe('XlsxGenerator', () => {
  it('XLSX形式で出力できる', async () => {
    const { config, pages } = await createTestData();
    const gen = new XlsxGenerator();

    expect(gen.format).toBe('xlsx');
    expect(gen.extension).toBe('.xlsx');

    const buffer = await gen.generate(pages, config);

    // XLSXもZIP形式
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4B);
    expect(buffer.length).toBeGreaterThan(1000);
  });
});

describe('DocxGenerator', () => {
  it('DOCX形式で出力できる', async () => {
    const { config, pages } = await createTestData();
    const gen = new DocxGenerator();

    expect(gen.format).toBe('docx');
    expect(gen.extension).toBe('.docx');

    const buffer = await gen.generate(pages, config);

    // DOCXもZIP形式
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4B);
    expect(buffer.length).toBeGreaterThan(1000);
  });
});

describe('getGenerator', () => {
  it('各フォーマットの正しいジェネレーターを返す', () => {
    expect(getGenerator('markdown')).toBeInstanceOf(MarkdownGenerator);
    expect(getGenerator('pptx')).toBeInstanceOf(PptxGenerator);
    expect(getGenerator('xlsx')).toBeInstanceOf(XlsxGenerator);
    expect(getGenerator('docx')).toBeInstanceOf(DocxGenerator);
  });
});
