import { describe, it, expect } from 'vitest';
import { buildAnnotationsSvg } from '../src/svg-builder.js';
import { annotateCapture } from '../src/annotator.js';
import sharp from 'sharp';
import type { ResolvedAnnotation, CaptureResult } from '../src/types.js';

describe('svg-builder', () => {
  const baseBox = { x: 100, y: 200, width: 300, height: 50 };

  it('highlightタイプのSVGを生成する', () => {
    const annotations: ResolvedAnnotation[] = [
      { type: 'highlight', selector: '.main', note: 'メイン', label: 'メインエリア', boundingBox: baseBox },
    ];
    const svg = buildAnnotationsSvg(annotations, 1280, 800);

    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox="0 0 1280 800"');
    expect(svg).toContain('stroke="#E53935"');
    expect(svg).toContain('stroke-width="3"');
    expect(svg).toContain('メインエリア');
  });

  it('arrowタイプのSVGを生成する', () => {
    const annotations: ResolvedAnnotation[] = [
      { type: 'arrow', selector: '#btn', note: '説明', label: '通知', number: 1, boundingBox: baseBox },
    ];
    const svg = buildAnnotationsSvg(annotations, 1280, 800);

    expect(svg).toContain('<line');
    expect(svg).toContain('<polygon');
    expect(svg).toContain('通知');
    expect(svg).toContain('>1<');
  });

  it('numberタイプのSVGを生成する', () => {
    const annotations: ResolvedAnnotation[] = [
      { type: 'number', selector: '#x', note: '説明', number: 3, label: 'プロフィール', boundingBox: baseBox },
    ];
    const svg = buildAnnotationsSvg(annotations, 1280, 800);

    expect(svg).toContain('<circle');
    expect(svg).toContain('>3<');
    expect(svg).toContain('プロフィール');
  });

  it('複数の注釈を1つのSVGに含める', () => {
    const annotations: ResolvedAnnotation[] = [
      { type: 'highlight', selector: '.a', note: 'A', boundingBox: { x: 10, y: 10, width: 100, height: 50 } },
      { type: 'number', selector: '.b', note: 'B', number: 1, boundingBox: { x: 200, y: 200, width: 80, height: 40 } },
      { type: 'arrow', selector: '.c', note: 'C', number: 2, boundingBox: { x: 400, y: 100, width: 120, height: 60 } },
    ];
    const svg = buildAnnotationsSvg(annotations, 1280, 800);

    expect(svg).toContain('stroke="#E53935"');
    expect(svg).toContain('<circle');
    expect(svg).toContain('<polygon');
  });

  it('XML特殊文字をエスケープする', () => {
    const annotations: ResolvedAnnotation[] = [
      { type: 'highlight', selector: '.x', note: 'test', label: '<script>&alert', boundingBox: baseBox },
    ];
    const svg = buildAnnotationsSvg(annotations, 1280, 800);

    expect(svg).toContain('&lt;script&gt;');
    expect(svg).toContain('&amp;alert');
    expect(svg).not.toContain('<script>');
  });

  it('注釈が空の場合も有効なSVGを返す', () => {
    const svg = buildAnnotationsSvg([], 1280, 800);
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });
});

describe('annotator', () => {
  it('注釈なしの場合はオリジナル画像をそのまま返す', async () => {
    const testPng = await sharp({
      create: { width: 100, height: 100, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
    }).png().toBuffer();

    const capture: CaptureResult = {
      pageConfig: { id: 'test', title: 'テスト', description: '説明', annotations: [] },
      screenshotBuffer: testPng,
      screenshotWidth: 100,
      screenshotHeight: 100,
      resolvedAnnotations: [],
    };

    const result = await annotateCapture(capture);
    expect(result.annotatedImageBuffer).toBe(testPng);
    expect(result.originalImageBuffer).toBe(testPng);
  });

  it('注釈ありの場合は合成画像を返す', async () => {
    const testPng = await sharp({
      create: { width: 200, height: 200, channels: 4, background: { r: 200, g: 200, b: 200, alpha: 1 } },
    }).png().toBuffer();

    const capture: CaptureResult = {
      pageConfig: {
        id: 'test',
        title: 'テスト',
        description: '説明',
        annotations: [
          { type: 'highlight', selector: '.x', note: 'テスト' },
        ],
      },
      screenshotBuffer: testPng,
      screenshotWidth: 200,
      screenshotHeight: 200,
      resolvedAnnotations: [
        {
          type: 'highlight',
          selector: '.x',
          note: 'テスト',
          label: 'ハイライト',
          boundingBox: { x: 20, y: 20, width: 60, height: 40 },
        },
      ],
    };

    const result = await annotateCapture(capture);

    // 合成後の画像はオリジナルと異なるバッファ
    expect(result.annotatedImageBuffer).not.toBe(testPng);
    expect(result.originalImageBuffer).toBe(testPng);

    // 合成後もPNG形式
    const metadata = await sharp(result.annotatedImageBuffer).metadata();
    expect(metadata.format).toBe('png');
    expect(metadata.width).toBe(200);
    expect(metadata.height).toBe(200);
  });
});
