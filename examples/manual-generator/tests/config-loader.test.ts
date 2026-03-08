import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { loadConfig } from '../src/config-loader.js';

const TMP_DIR = join(import.meta.dirname, '../.tmp-test');

async function writeYaml(filename: string, content: string): Promise<string> {
  await mkdir(TMP_DIR, { recursive: true });
  const path = join(TMP_DIR, filename);
  await writeFile(path, content, 'utf-8');
  return path;
}

const VALID_YAML = `
manual:
  title: "テストマニュアル"
  version: "1.0"
  author: "テスト"
  output_formats: [markdown, pptx]

auth:
  url: "https://example.com/login"
  steps:
    - action: fill
      selector: "#user"
      value: "admin"
    - action: click
      selector: "#submit"

pages:
  - id: top
    title: "トップページ"
    description: "最初の画面です"
    annotations:
      - type: highlight
        selector: ".main"
        note: "メインエリア"
`;

describe('config-loader', () => {
  beforeEach(async () => {
    await mkdir(TMP_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TMP_DIR, { recursive: true, force: true });
  });

  it('有効なYAMLを正しくパースできる', async () => {
    const path = await writeYaml('valid.yaml', VALID_YAML);
    const config = await loadConfig(path);

    expect(config.manual.title).toBe('テストマニュアル');
    expect(config.manual.version).toBe('1.0');
    expect(config.manual.output_formats).toEqual(['markdown', 'pptx']);
    expect(config.auth.url).toBe('https://example.com/login');
    expect(config.auth.steps).toHaveLength(2);
    expect(config.pages).toHaveLength(1);
    expect(config.pages[0].id).toBe('top');
    expect(config.pages[0].annotations).toHaveLength(1);
  });

  it('環境変数を展開できる', async () => {
    process.env.TEST_USER = 'testuser';
    process.env.TEST_PASS = 'secret123';

    const yaml = `
manual:
  title: "テスト"
auth:
  url: "https://example.com"
  steps:
    - action: fill
      selector: "#user"
      value: "\${TEST_USER}"
    - action: fill
      selector: "#pass"
      value: "\${TEST_PASS}"
pages:
  - id: p1
    title: "ページ1"
    description: "説明"
    annotations: []
`;
    const path = await writeYaml('env.yaml', yaml);
    const config = await loadConfig(path);

    expect(config.auth.steps[0].value).toBe('testuser');
    expect(config.auth.steps[1].value).toBe('secret123');

    delete process.env.TEST_USER;
    delete process.env.TEST_PASS;
  });

  it('未定義の環境変数でエラーになる', async () => {
    const yaml = `
manual:
  title: "テスト"
auth:
  url: "https://example.com"
  steps:
    - action: fill
      selector: "#user"
      value: "\${UNDEFINED_VAR_XYZ}"
pages:
  - id: p1
    title: "ページ1"
    description: "説明"
    annotations: []
`;
    const path = await writeYaml('badenv.yaml', yaml);
    await expect(loadConfig(path)).rejects.toThrow('環境変数 UNDEFINED_VAR_XYZ が未定義です');
  });

  it('manualセクション欠落でエラー', async () => {
    const yaml = `
auth:
  url: "https://example.com"
pages:
  - id: p1
    title: "ページ1"
    description: "説明"
    annotations: []
`;
    const path = await writeYaml('no-manual.yaml', yaml);
    await expect(loadConfig(path)).rejects.toThrow('manual セクションが必須です');
  });

  it('authセクション欠落でエラー', async () => {
    const yaml = `
manual:
  title: "テスト"
pages:
  - id: p1
    title: "ページ1"
    description: "説明"
    annotations: []
`;
    const path = await writeYaml('no-auth.yaml', yaml);
    await expect(loadConfig(path)).rejects.toThrow('auth セクションが必須です');
  });

  it('pagesが空でエラー', async () => {
    const yaml = `
manual:
  title: "テスト"
auth:
  url: "https://example.com"
pages: []
`;
    const path = await writeYaml('no-pages.yaml', yaml);
    await expect(loadConfig(path)).rejects.toThrow('pages: 1ページ以上必須です');
  });

  it('不正なアクションでエラー', async () => {
    const yaml = `
manual:
  title: "テスト"
auth:
  url: "https://example.com"
  steps:
    - action: invalid_action
      selector: "#x"
pages:
  - id: p1
    title: "ページ1"
    description: "説明"
    annotations: []
`;
    const path = await writeYaml('bad-action.yaml', yaml);
    await expect(loadConfig(path)).rejects.toThrow('無効です');
  });

  it('fillアクションにvalue欠落でエラー', async () => {
    const yaml = `
manual:
  title: "テスト"
auth:
  url: "https://example.com"
  steps:
    - action: fill
      selector: "#user"
pages:
  - id: p1
    title: "ページ1"
    description: "説明"
    annotations: []
`;
    const path = await writeYaml('no-value.yaml', yaml);
    await expect(loadConfig(path)).rejects.toThrow('valueが必須です');
  });

  it('不正な注釈タイプでエラー', async () => {
    const yaml = `
manual:
  title: "テスト"
auth:
  url: "https://example.com"
pages:
  - id: p1
    title: "ページ1"
    description: "説明"
    annotations:
      - type: invalid_type
        selector: "#x"
        note: "テスト"
`;
    const path = await writeYaml('bad-annotation.yaml', yaml);
    await expect(loadConfig(path)).rejects.toThrow('無効です');
  });

  it('デフォルト値が適用される', async () => {
    const yaml = `
manual:
  title: "テスト"
auth:
  url: "https://example.com"
pages:
  - id: p1
    title: "ページ1"
    description: "説明"
    annotations: []
`;
    const path = await writeYaml('defaults.yaml', yaml);
    const config = await loadConfig(path);

    expect(config.manual.version).toBe('1.0');
    expect(config.manual.author).toBe('自動生成');
    expect(config.manual.output_formats).toEqual(['markdown', 'pptx', 'xlsx', 'docx']);
  });

  it('navigateステップを持つページを正しくパースできる', async () => {
    const yaml = `
manual:
  title: "テスト"
auth:
  url: "https://example.com"
pages:
  - id: p1
    title: "ページ1"
    description: "説明"
    navigate:
      - action: click
        selector: "#menu-link"
      - action: wait
        selector: ".loaded"
    annotations: []
`;
    const path = await writeYaml('navigate.yaml', yaml);
    const config = await loadConfig(path);

    expect(config.pages[0].navigate).toHaveLength(2);
    expect(config.pages[0].navigate![0].action).toBe('click');
  });
});
