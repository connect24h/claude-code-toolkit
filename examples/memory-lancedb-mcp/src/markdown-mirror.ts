import { mkdir, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { MemoryEntry } from './types.js';

/** 記憶エントリをMarkdownファイルに書き出す（監査ログ） */
export async function mirrorToMarkdown(
  entry: MemoryEntry,
  markdownPath: string,
): Promise<void> {
  await mkdir(markdownPath, { recursive: true });

  const date = entry.createdAt.split('T')[0];
  const fileName = `${date}_${entry.id.slice(0, 8)}.md`;
  const filePath = join(markdownPath, fileName);

  const content = [
    `# ${entry.category}: ${entry.content.slice(0, 60)}`,
    '',
    `- **ID**: ${entry.id}`,
    `- **カテゴリ**: ${entry.category}`,
    `- **スコープ**: ${entry.scope}`,
    `- **重要度**: ${entry.importance}/10`,
    `- **タグ**: ${entry.tags.join(', ') || 'なし'}`,
    `- **ソース**: ${entry.source}`,
    `- **作成日時**: ${entry.createdAt}`,
    '',
    '## 内容',
    '',
    entry.content,
    '',
  ].join('\n');

  await writeFile(filePath, content, 'utf-8');
}

/** 全記憶をまとめたサマリーMarkdownを生成 */
export async function exportSummaryMarkdown(
  entries: MemoryEntry[],
  markdownPath: string,
): Promise<string> {
  await mkdir(markdownPath, { recursive: true });

  const lines: string[] = [
    '# Memory Export',
    '',
    `- **総エントリ数**: ${entries.length}`,
    `- **エクスポート日時**: ${new Date().toISOString()}`,
    '',
    '---',
    '',
  ];

  // カテゴリ別にグループ化
  const grouped = new Map<string, MemoryEntry[]>();
  for (const entry of entries) {
    const list = grouped.get(entry.category) ?? [];
    list.push(entry);
    grouped.set(entry.category, list);
  }

  for (const [category, categoryEntries] of grouped) {
    lines.push(`## ${category} (${categoryEntries.length}件)`);
    lines.push('');
    for (const entry of categoryEntries) {
      lines.push(`### ${entry.content.slice(0, 80)}`);
      lines.push('');
      lines.push(`- スコープ: ${entry.scope} | 重要度: ${entry.importance} | 日時: ${entry.createdAt}`);
      lines.push(`- タグ: ${entry.tags.join(', ') || 'なし'}`);
      lines.push('');
      lines.push(entry.content);
      lines.push('');
    }
  }

  const filePath = join(markdownPath, 'memory-export.md');
  const content = lines.join('\n');
  await writeFile(filePath, content, 'utf-8');
  return filePath;
}
