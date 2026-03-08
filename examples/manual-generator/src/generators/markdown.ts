import type { ManualGenerator, AnnotatedPage, ManualConfig, OutputFormat } from '../types.js';

export class MarkdownGenerator implements ManualGenerator {
  readonly format: OutputFormat = 'markdown';
  readonly extension = '.md';

  async generate(pages: AnnotatedPage[], config: ManualConfig): Promise<Buffer> {
    const lines: string[] = [];
    const now = new Date().toISOString().split('T')[0];

    // ヘッダー
    lines.push(`# ${config.manual.title}`);
    lines.push('');
    lines.push(`- **バージョン**: ${config.manual.version}`);
    lines.push(`- **作成者**: ${config.manual.author}`);
    lines.push(`- **作成日**: ${now}`);
    lines.push('');

    // 目次
    lines.push('## 目次');
    lines.push('');
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      lines.push(`${i + 1}. [${page.pageConfig.title}](#${page.pageConfig.id})`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');

    // 各ページ
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { pageConfig, annotatedImageBuffer, resolvedAnnotations } = page;

      lines.push(`## ${i + 1}. ${pageConfig.title} {#${pageConfig.id}}`);
      lines.push('');
      lines.push(pageConfig.description);
      lines.push('');

      // スクリーンショット（base64埋込）
      const base64 = annotatedImageBuffer.toString('base64');
      lines.push(`![${pageConfig.title}](data:image/png;base64,${base64})`);
      lines.push('');

      // 注釈テーブル
      if (resolvedAnnotations.length > 0) {
        lines.push('### 画面要素の説明');
        lines.push('');
        lines.push('| # | 種別 | 要素 | 説明 |');
        lines.push('|---|------|------|------|');
        for (const ann of resolvedAnnotations) {
          const num = ann.number ?? '-';
          const typeLabel = ann.type === 'highlight' ? 'ハイライト' : ann.type === 'arrow' ? '矢印' : '番号';
          const label = ann.label ?? '-';
          lines.push(`| ${num} | ${typeLabel} | ${label} | ${ann.note} |`);
        }
        lines.push('');
      }

      if (i < pages.length - 1) {
        lines.push('---');
        lines.push('');
      }
    }

    return Buffer.from(lines.join('\n'), 'utf-8');
  }
}
