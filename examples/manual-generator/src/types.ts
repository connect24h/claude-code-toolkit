// manual-generator 型定義

/** 出力フォーマット */
export type OutputFormat = 'markdown' | 'pptx' | 'xlsx' | 'docx';

/** 認証ステップのアクション種別 */
export type AuthActionType = 'fill' | 'click' | 'wait' | 'select';

/** 注釈の種別 */
export type AnnotationType = 'highlight' | 'arrow' | 'number';

/** ビューポート設定 */
export interface ViewportConfig {
  width: number;
  height: number;
}

/** スクリーンショット設定 */
export interface ScreenshotOptions {
  fullPage?: boolean;
  viewport?: ViewportConfig;
}

/** 認証ステップ */
export interface AuthStep {
  action: AuthActionType;
  selector: string;
  value?: string;
}

/** 認証設定 */
export interface AuthConfig {
  url: string;
  steps: AuthStep[];
}

/** 注釈定義 */
export interface Annotation {
  type: AnnotationType;
  selector: string;
  label?: string;
  note: string;
  number?: number;
}

/** ナビゲーションステップ（ページ遷移用） */
export interface NavigateStep {
  action: AuthActionType;
  selector: string;
  value?: string;
}

/** ページ定義 */
export interface PageConfig {
  id: string;
  title: string;
  url?: string;
  navigate?: NavigateStep[];
  description: string;
  screenshot?: ScreenshotOptions;
  annotations: Annotation[];
}

/** マニュアルメタ情報 */
export interface ManualMeta {
  title: string;
  version: string;
  author: string;
  output_formats: OutputFormat[];
}

/** トップレベル設定 */
export interface ManualConfig {
  manual: ManualMeta;
  auth: AuthConfig;
  pages: PageConfig[];
}

/** 要素の座標情報 */
export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** 座標付き注釈（キャプチャ後） */
export interface ResolvedAnnotation extends Annotation {
  boundingBox: BoundingBox;
}

/** キャプチャ結果（1ページ分） */
export interface CaptureResult {
  pageConfig: PageConfig;
  screenshotBuffer: Buffer;
  screenshotWidth: number;
  screenshotHeight: number;
  resolvedAnnotations: ResolvedAnnotation[];
}

/** 注釈済みページ（ドキュメント生成用） */
export interface AnnotatedPage {
  pageConfig: PageConfig;
  annotatedImageBuffer: Buffer;
  originalImageBuffer: Buffer;
  resolvedAnnotations: ResolvedAnnotation[];
}

/** ドキュメント生成インターフェース */
export interface ManualGenerator {
  generate(pages: AnnotatedPage[], config: ManualConfig): Promise<Buffer>;
  readonly format: OutputFormat;
  readonly extension: string;
}
