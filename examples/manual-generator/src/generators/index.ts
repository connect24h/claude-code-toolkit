export { MarkdownGenerator } from './markdown.js';
export { PptxGenerator } from './pptx.js';
export { XlsxGenerator } from './xlsx.js';
export { DocxGenerator } from './docx.js';
import type { ManualGenerator, OutputFormat } from '../types.js';
import { MarkdownGenerator } from './markdown.js';
import { PptxGenerator } from './pptx.js';
import { XlsxGenerator } from './xlsx.js';
import { DocxGenerator } from './docx.js';

/** 指定フォーマットのジェネレーターを取得 */
export function getGenerator(format: OutputFormat): ManualGenerator {
  switch (format) {
    case 'markdown':
      return new MarkdownGenerator();
    case 'pptx':
      return new PptxGenerator();
    case 'xlsx':
      return new XlsxGenerator();
    case 'docx':
      return new DocxGenerator();
  }
}

/** 全ジェネレーターを取得 */
export function getAllGenerators(formats: OutputFormat[]): ManualGenerator[] {
  return formats.map(getGenerator);
}
