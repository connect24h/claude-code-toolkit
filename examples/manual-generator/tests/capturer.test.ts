import { describe, it, expect, vi, beforeEach } from 'vitest';

// Playwright モック
const mockFill = vi.fn();
const mockClick = vi.fn();
const mockWaitFor = vi.fn();
const mockSelectOption = vi.fn();
const mockBoundingBox = vi.fn();
const mockScreenshot = vi.fn();
const mockGoto = vi.fn();
const mockSetViewportSize = vi.fn();
const mockWaitForLoadState = vi.fn();
const mockSetDefaultTimeout = vi.fn();
const mockViewportSize = vi.fn();
const mockContextClose = vi.fn();
const mockBrowserClose = vi.fn();
const mockNewPage = vi.fn();
const mockNewContext = vi.fn();
const mockLaunch = vi.fn();

const mockLocator = vi.fn().mockReturnValue({
  fill: mockFill,
  click: mockClick,
  waitFor: mockWaitFor,
  selectOption: mockSelectOption,
  boundingBox: mockBoundingBox,
});

const mockPage = {
  locator: mockLocator,
  screenshot: mockScreenshot,
  goto: mockGoto,
  setViewportSize: mockSetViewportSize,
  waitForLoadState: mockWaitForLoadState,
  setDefaultTimeout: mockSetDefaultTimeout,
  viewportSize: mockViewportSize,
};

vi.mock('playwright', () => ({
  chromium: {
    launch: (...args: unknown[]) => mockLaunch(...args),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();

  mockNewPage.mockResolvedValue(mockPage);
  mockNewContext.mockResolvedValue({
    newPage: mockNewPage,
    close: mockContextClose,
  });
  mockLaunch.mockResolvedValue({
    newContext: mockNewContext,
    close: mockBrowserClose,
  });

  mockScreenshot.mockResolvedValue(Buffer.from('fake-png'));
  mockViewportSize.mockReturnValue({ width: 1280, height: 800 });
  mockBoundingBox.mockResolvedValue({ x: 100, y: 200, width: 300, height: 50 });
  mockGoto.mockResolvedValue(undefined);
  mockWaitForLoadState.mockResolvedValue(undefined);
  mockFill.mockResolvedValue(undefined);
  mockClick.mockResolvedValue(undefined);
  mockWaitFor.mockResolvedValue(undefined);
});

describe('capturer', () => {
  it('認証ステップを順番に実行する', async () => {
    const { capturePages } = await import('../src/capturer.js');

    const config = {
      manual: { title: 'テスト', version: '1.0', author: 'test', output_formats: ['markdown' as const] },
      auth: {
        url: 'https://example.com/login',
        steps: [
          { action: 'fill' as const, selector: '#user', value: 'admin' },
          { action: 'fill' as const, selector: '#pass', value: 'secret' },
          { action: 'click' as const, selector: '#submit' },
          { action: 'wait' as const, selector: '.dashboard' },
        ],
      },
      pages: [
        {
          id: 'top',
          title: 'トップ',
          description: '説明',
          annotations: [],
        },
      ],
    };

    await capturePages(config);

    // ブラウザ起動確認
    expect(mockLaunch).toHaveBeenCalledWith({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    // 認証URL遷移
    expect(mockGoto).toHaveBeenCalledWith('https://example.com/login', { waitUntil: 'networkidle' });

    // fillが2回、clickが1回、waitForが1回呼ばれる
    expect(mockFill).toHaveBeenCalledTimes(2);
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockWaitFor).toHaveBeenCalledTimes(1);
  });

  it('スクリーンショットを取得しCaptureResultを返す', async () => {
    const { capturePages } = await import('../src/capturer.js');

    const config = {
      manual: { title: 'テスト', version: '1.0', author: 'test', output_formats: ['markdown' as const] },
      auth: {
        url: 'https://example.com/login',
        steps: [],
      },
      pages: [
        {
          id: 'page1',
          title: 'ページ1',
          description: '説明1',
          annotations: [
            { type: 'highlight' as const, selector: '.main', note: 'メイン', label: 'メインエリア' },
          ],
        },
      ],
    };

    const results = await capturePages(config);

    expect(results).toHaveLength(1);
    expect(results[0].pageConfig.id).toBe('page1');
    expect(results[0].screenshotBuffer).toBeInstanceOf(Buffer);
    expect(results[0].screenshotWidth).toBe(1280);
    expect(results[0].screenshotHeight).toBe(800);
    expect(results[0].resolvedAnnotations).toHaveLength(1);
    expect(results[0].resolvedAnnotations[0].boundingBox).toEqual({
      x: 100, y: 200, width: 300, height: 50,
    });
  });

  it('ブラウザを確実にクローズする', async () => {
    const { capturePages } = await import('../src/capturer.js');

    const config = {
      manual: { title: 'テスト', version: '1.0', author: 'test', output_formats: ['markdown' as const] },
      auth: { url: 'https://example.com', steps: [] },
      pages: [{ id: 'p', title: 'T', description: 'D', annotations: [] }],
    };

    await capturePages(config);

    expect(mockContextClose).toHaveBeenCalledTimes(1);
    expect(mockBrowserClose).toHaveBeenCalledTimes(1);
  });

  it('navigateステップでページ遷移する', async () => {
    const { capturePages } = await import('../src/capturer.js');

    const config = {
      manual: { title: 'テスト', version: '1.0', author: 'test', output_formats: ['markdown' as const] },
      auth: { url: 'https://example.com', steps: [] },
      pages: [
        {
          id: 'nav-page',
          title: 'ナビページ',
          description: '遷移テスト',
          navigate: [
            { action: 'click' as const, selector: '#menu-link' },
            { action: 'wait' as const, selector: '.loaded' },
          ],
          annotations: [],
        },
      ],
    };

    await capturePages(config);

    // navigate内のclick + wait
    expect(mockClick).toHaveBeenCalledTimes(1);
    expect(mockWaitFor).toHaveBeenCalledTimes(1);
    expect(mockWaitForLoadState).toHaveBeenCalledWith('networkidle');
  });

  it('要素が見つからない場合は注釈をスキップする', async () => {
    mockBoundingBox.mockResolvedValueOnce(null);
    const { capturePages } = await import('../src/capturer.js');

    const config = {
      manual: { title: 'テスト', version: '1.0', author: 'test', output_formats: ['markdown' as const] },
      auth: { url: 'https://example.com', steps: [] },
      pages: [
        {
          id: 'p',
          title: 'T',
          description: 'D',
          annotations: [
            { type: 'highlight' as const, selector: '.missing', note: '見つからない' },
          ],
        },
      ],
    };

    const results = await capturePages(config);
    expect(results[0].resolvedAnnotations).toHaveLength(0);
  });
});
