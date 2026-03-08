import { readFile } from 'node:fs/promises';
import yaml from 'js-yaml';
import type {
  ManualConfig,
  AuthStep,
  PageConfig,
  Annotation,
  OutputFormat,
  AuthActionType,
  AnnotationType,
} from './types.js';

const VALID_ACTIONS: AuthActionType[] = ['fill', 'click', 'wait', 'select'];
const VALID_FORMATS: OutputFormat[] = ['markdown', 'pptx', 'xlsx', 'docx'];
const VALID_ANNOTATION_TYPES: AnnotationType[] = ['highlight', 'arrow', 'number'];
const ENV_VAR_PATTERN = /\$\{([A-Z_][A-Z0-9_]*)\}/g;

/** 環境変数を展開する */
function expandEnvVars(value: string): string {
  return value.replace(ENV_VAR_PATTERN, (match, varName: string) => {
    const envValue = process.env[varName];
    if (envValue === undefined) {
      throw new Error(`環境変数 ${varName} が未定義です`);
    }
    return envValue;
  });
}

/** 文字列内の環境変数を再帰的に展開 */
function expandEnvVarsDeep<T>(obj: T): T {
  if (typeof obj === 'string') {
    return expandEnvVars(obj) as T;
  }
  if (Array.isArray(obj)) {
    return obj.map(expandEnvVarsDeep) as T;
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = expandEnvVarsDeep(val);
    }
    return result as T;
  }
  return obj;
}

/** AuthStepのバリデーション */
function validateAuthStep(step: unknown, index: number): AuthStep {
  const s = step as Record<string, unknown>;
  if (!s || typeof s !== 'object') {
    throw new Error(`auth.steps[${index}]: オブジェクトである必要があります`);
  }
  if (!VALID_ACTIONS.includes(s.action as AuthActionType)) {
    throw new Error(
      `auth.steps[${index}].action: "${String(s.action)}" は無効です。有効値: ${VALID_ACTIONS.join(', ')}`,
    );
  }
  if (typeof s.selector !== 'string' || s.selector.length === 0) {
    throw new Error(`auth.steps[${index}].selector: 必須です`);
  }
  if (s.action === 'fill' && (typeof s.value !== 'string' || s.value.length === 0)) {
    throw new Error(`auth.steps[${index}].value: fillアクションにはvalueが必須です`);
  }
  return {
    action: s.action as AuthActionType,
    selector: s.selector as string,
    ...(s.value !== undefined ? { value: s.value as string } : {}),
  };
}

/** Annotationのバリデーション */
function validateAnnotation(ann: unknown, pageId: string, index: number): Annotation {
  const a = ann as Record<string, unknown>;
  if (!a || typeof a !== 'object') {
    throw new Error(`pages[${pageId}].annotations[${index}]: オブジェクトである必要があります`);
  }
  if (!VALID_ANNOTATION_TYPES.includes(a.type as AnnotationType)) {
    throw new Error(
      `pages[${pageId}].annotations[${index}].type: "${String(a.type)}" は無効です。有効値: ${VALID_ANNOTATION_TYPES.join(', ')}`,
    );
  }
  if (typeof a.selector !== 'string' || a.selector.length === 0) {
    throw new Error(`pages[${pageId}].annotations[${index}].selector: 必須です`);
  }
  if (typeof a.note !== 'string' || a.note.length === 0) {
    throw new Error(`pages[${pageId}].annotations[${index}].note: 必須です`);
  }
  if (a.type === 'number' && (typeof a.number !== 'number' || a.number < 1)) {
    throw new Error(`pages[${pageId}].annotations[${index}].number: 1以上の数値が必須です`);
  }
  return {
    type: a.type as AnnotationType,
    selector: a.selector as string,
    note: a.note as string,
    ...(a.label !== undefined ? { label: a.label as string } : {}),
    ...(a.number !== undefined ? { number: a.number as number } : {}),
  };
}

/** PageConfigのバリデーション */
function validatePage(page: unknown, index: number): PageConfig {
  const p = page as Record<string, unknown>;
  if (!p || typeof p !== 'object') {
    throw new Error(`pages[${index}]: オブジェクトである必要があります`);
  }
  if (typeof p.id !== 'string' || p.id.length === 0) {
    throw new Error(`pages[${index}].id: 必須です`);
  }
  if (typeof p.title !== 'string' || p.title.length === 0) {
    throw new Error(`pages[${index}].title: 必須です`);
  }
  if (typeof p.description !== 'string' || p.description.length === 0) {
    throw new Error(`pages[${index}].description: 必須です`);
  }
  const annotations = Array.isArray(p.annotations)
    ? p.annotations.map((a, i) => validateAnnotation(a, p.id as string, i))
    : [];

  const navigate = Array.isArray(p.navigate)
    ? p.navigate.map((s, i) => validateAuthStep(s, i))
    : undefined;

  return {
    id: p.id as string,
    title: p.title as string,
    description: p.description as string,
    annotations,
    ...(p.url !== undefined ? { url: p.url as string } : {}),
    ...(navigate ? { navigate } : {}),
    ...(p.screenshot !== undefined ? { screenshot: p.screenshot as PageConfig['screenshot'] } : {}),
  };
}

/** YAML設定ファイルを読み込んでバリデーション済みManualConfigを返す */
export async function loadConfig(filePath: string): Promise<ManualConfig> {
  const content = await readFile(filePath, 'utf-8');
  const raw = yaml.load(content) as Record<string, unknown>;

  if (!raw || typeof raw !== 'object') {
    throw new Error('設定ファイルが空またはオブジェクトではありません');
  }

  // manual セクション
  const manual = raw.manual as Record<string, unknown> | undefined;
  if (!manual || typeof manual !== 'object') {
    throw new Error('manual セクションが必須です');
  }
  if (typeof manual.title !== 'string' || manual.title.length === 0) {
    throw new Error('manual.title: 必須です');
  }
  const outputFormats = Array.isArray(manual.output_formats)
    ? manual.output_formats.filter((f): f is OutputFormat => VALID_FORMATS.includes(f as OutputFormat))
    : VALID_FORMATS;

  // auth セクション
  const auth = raw.auth as Record<string, unknown> | undefined;
  if (!auth || typeof auth !== 'object') {
    throw new Error('auth セクションが必須です');
  }
  if (typeof auth.url !== 'string' || auth.url.length === 0) {
    throw new Error('auth.url: 必須です');
  }
  const authSteps = Array.isArray(auth.steps)
    ? auth.steps.map((s, i) => validateAuthStep(s, i))
    : [];

  // pages セクション
  const pages = raw.pages as unknown[];
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new Error('pages: 1ページ以上必須です');
  }
  const validatedPages = pages.map((p, i) => validatePage(p, i));

  const config: ManualConfig = {
    manual: {
      title: manual.title as string,
      version: (manual.version as string) ?? '1.0',
      author: (manual.author as string) ?? '自動生成',
      output_formats: outputFormats,
    },
    auth: {
      url: auth.url as string,
      steps: authSteps,
    },
    pages: validatedPages,
  };

  // 環境変数展開
  return expandEnvVarsDeep(config);
}
