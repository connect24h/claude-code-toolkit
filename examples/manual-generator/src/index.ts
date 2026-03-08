import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { loadConfig } from './config-loader.js';
import { capturePages } from './capturer.js';
import { annotateAll } from './annotator.js';
import { getGenerator } from './generators/index.js';
import type { OutputFormat } from './types.js';

function log(msg: string): void {
  const time = new Date().toLocaleTimeString('ja-JP');
  process.stderr.write(`[${time}] ${msg}\n`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    process.stderr.write(`
使用方法: npx tsx src/index.ts <config.yaml> [オプション]

オプション:
  --format <formats>   出力形式（カンマ区切り: markdown,pptx,xlsx,docx）
  --output <dir>       出力ディレクトリ（デフォルト: output/manual-YYYYMMDD）
  --help, -h           ヘルプ表示

例:
  npx tsx src/index.ts examples/sample-config.yaml
  npx tsx src/index.ts config.yaml --format markdown,pptx
  npx tsx src/index.ts config.yaml --output ./my-manual
`);
    process.exit(args.length === 0 ? 1 : 0);
  }

  const configPath = resolve(args[0]);
  let formatOverride: OutputFormat[] | undefined;
  let outputDir: string | undefined;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--format' && args[i + 1]) {
      formatOverride = args[i + 1].split(',').map((f) => f.trim()) as OutputFormat[];
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      outputDir = resolve(args[i + 1]);
      i++;
    }
  }

  // 1. 設定読込
  log('設定ファイルを読み込み中...');
  const config = await loadConfig(configPath);
  log(`  タイトル: ${config.manual.title}`);
  log(`  ページ数: ${config.pages.length}`);

  const formats = formatOverride ?? config.manual.output_formats;
  log(`  出力形式: ${formats.join(', ')}`);

  // 2. 出力ディレクトリ作成
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const outDir = outputDir ?? join(process.cwd(), 'output', `manual-${date}`);
  await mkdir(outDir, { recursive: true });
  log(`  出力先: ${outDir}`);

  // 3. ブラウザ操作 + キャプチャ
  log('ブラウザを起動してキャプチャ中...');
  const captures = await capturePages(config);
  log(`  ${captures.length} ページをキャプチャ完了`);

  // 4. 注釈付与
  log('注釈を付与中...');
  const annotatedPages = await annotateAll(captures);
  const totalAnnotations = annotatedPages.reduce(
    (sum, p) => sum + p.resolvedAnnotations.length,
    0,
  );
  log(`  ${totalAnnotations} 件の注釈を合成完了`);

  // 5. ドキュメント生成
  for (const format of formats) {
    log(`${format} を生成中...`);
    const generator = getGenerator(format);
    const buffer = await generator.generate(annotatedPages, config);
    const fileName = `${config.manual.title}${generator.extension}`;
    const filePath = join(outDir, fileName);
    await writeFile(filePath, buffer);
    log(`  -> ${filePath} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  log('完了');
}

main().catch((err: Error) => {
  process.stderr.write(`エラー: ${err.message}\n`);
  process.exit(1);
});
