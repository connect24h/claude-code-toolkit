import sharp from 'sharp';
import { buildAnnotationsSvg } from './svg-builder.js';
import type { CaptureResult, AnnotatedPage } from './types.js';

/** キャプチャ結果に注釈を合成して返す */
export async function annotateCapture(capture: CaptureResult): Promise<AnnotatedPage> {
  const { screenshotBuffer, screenshotWidth, screenshotHeight, resolvedAnnotations } = capture;

  if (resolvedAnnotations.length === 0) {
    return {
      pageConfig: capture.pageConfig,
      annotatedImageBuffer: screenshotBuffer,
      originalImageBuffer: screenshotBuffer,
      resolvedAnnotations: [],
    };
  }

  // SVG注釈を生成
  const svgString = buildAnnotationsSvg(resolvedAnnotations, screenshotWidth, screenshotHeight);
  const svgBuffer = Buffer.from(svgString);

  // Sharp で合成
  const annotatedBuffer = await sharp(screenshotBuffer)
    .composite([
      {
        input: svgBuffer,
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  return {
    pageConfig: capture.pageConfig,
    annotatedImageBuffer: annotatedBuffer,
    originalImageBuffer: screenshotBuffer,
    resolvedAnnotations,
  };
}

/** 複数キャプチャ結果をまとめて注釈処理 */
export async function annotateAll(captures: CaptureResult[]): Promise<AnnotatedPage[]> {
  const results: AnnotatedPage[] = [];
  for (const capture of captures) {
    results.push(await annotateCapture(capture));
  }
  return results;
}
