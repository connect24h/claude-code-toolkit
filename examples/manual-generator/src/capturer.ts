import { chromium, type Browser, type Page, type BrowserContext } from 'playwright';
import type {
  ManualConfig,
  AuthStep,
  NavigateStep,
  CaptureResult,
  ResolvedAnnotation,
  BoundingBox,
  Annotation,
} from './types.js';

const DEFAULT_TIMEOUT = 30_000;
const ELEMENT_TIMEOUT = 10_000;
const DEFAULT_VIEWPORT = { width: 1280, height: 800 };

/** 単一ステップを実行する */
async function executeStep(page: Page, step: AuthStep | NavigateStep): Promise<void> {
  switch (step.action) {
    case 'fill':
      await page.locator(step.selector).fill(step.value ?? '');
      break;
    case 'click':
      await page.locator(step.selector).click();
      break;
    case 'wait':
      await page.locator(step.selector).waitFor({
        state: 'visible',
        timeout: ELEMENT_TIMEOUT,
      });
      break;
    case 'select':
      await page.locator(step.selector).selectOption(step.value ?? '');
      break;
  }
}

/** 注釈対象要素の座標を取得する */
async function resolveAnnotationBox(
  page: Page,
  annotation: Annotation,
): Promise<BoundingBox | null> {
  try {
    const locator = page.locator(annotation.selector);
    await locator.waitFor({ state: 'visible', timeout: 5000 });
    const box = await locator.boundingBox();
    if (!box) return null;
    return {
      x: Math.round(box.x),
      y: Math.round(box.y),
      width: Math.round(box.width),
      height: Math.round(box.height),
    };
  } catch {
    return null;
  }
}

/** 全ページをキャプチャする */
export async function capturePages(config: ManualConfig): Promise<CaptureResult[]> {
  let browser: Browser | undefined;
  let context: BrowserContext | undefined;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const firstPage = config.pages[0];
    const viewport = firstPage?.screenshot?.viewport ?? DEFAULT_VIEWPORT;

    context = await browser.newContext({ viewport });
    const page = await context.newPage();
    page.setDefaultTimeout(DEFAULT_TIMEOUT);

    // 認証ステップ実行
    await page.goto(config.auth.url, { waitUntil: 'networkidle' });
    for (const step of config.auth.steps) {
      await executeStep(page, step);
    }

    // 各ページのキャプチャ
    const results: CaptureResult[] = [];

    for (const pageConfig of config.pages) {
      // ビューポート変更（ページ個別設定がある場合）
      if (pageConfig.screenshot?.viewport) {
        await page.setViewportSize(pageConfig.screenshot.viewport);
      }

      // ページ遷移
      if (pageConfig.url) {
        const url = pageConfig.url.startsWith('http')
          ? pageConfig.url
          : new URL(pageConfig.url, config.auth.url).toString();
        await page.goto(url, { waitUntil: 'networkidle' });
      } else if (pageConfig.navigate) {
        for (const step of pageConfig.navigate) {
          await executeStep(page, step);
        }
        await page.waitForLoadState('networkidle');
      }

      // スクリーンショット取得
      const screenshotBuffer = await page.screenshot({
        fullPage: pageConfig.screenshot?.fullPage ?? false,
        type: 'png',
      });

      // 画面サイズ取得
      const viewportSize = page.viewportSize() ?? DEFAULT_VIEWPORT;

      // 注釈座標の解決
      const resolvedAnnotations: ResolvedAnnotation[] = [];
      let autoNumber = 1;

      for (const annotation of pageConfig.annotations) {
        const boundingBox = await resolveAnnotationBox(page, annotation);
        if (boundingBox) {
          resolvedAnnotations.push({
            ...annotation,
            number: annotation.number ?? autoNumber++,
            boundingBox,
          });
        }
      }

      results.push({
        pageConfig,
        screenshotBuffer: Buffer.from(screenshotBuffer),
        screenshotWidth: viewportSize.width,
        screenshotHeight: viewportSize.height,
        resolvedAnnotations,
      });
    }

    return results;
  } finally {
    await context?.close();
    await browser?.close();
  }
}
