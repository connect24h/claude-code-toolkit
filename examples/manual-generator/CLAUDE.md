# manual-generator

認証画面キャプチャ→注釈付与→利用マニュアル自動生成ツール。

## 技術スタック

- **言語**: TypeScript (ES2022+, strict mode)
- **ランタイム**: Node.js + tsx
- **テスト**: Vitest (29テスト)
- **ブラウザ**: Playwright (chromium headless)
- **画像処理**: Sharp + SVGテンプレート
- **ドキュメント**: PptxGenJS / ExcelJS / docx / Markdown

## コマンド

```bash
npm start          # ヘルプ表示
npm test           # テスト実行
npm run typecheck  # 型チェック
npx tsx src/index.ts <config.yaml> [--format md,pptx] [--output dir]
```

## ディレクトリ構成

```
src/
├── index.ts           # CLIエントリーポイント
├── types.ts           # 型定義
├── config-loader.ts   # YAML読込 + バリデーション
├── capturer.ts        # Playwright操作 + SS取得
├── annotator.ts       # SVG注釈 + Sharp合成
├── svg-builder.ts     # SVG注釈テンプレート
└── generators/
    ├── index.ts       # ジェネレーター共通
    ├── markdown.ts    # Markdown生成
    ├── pptx.ts        # PowerPoint生成
    ├── xlsx.ts        # Excel生成
    └── docx.ts        # Word生成
```

## 注意事項

- 認証情報はYAMLに直書きしない。`${ENV_VAR}` で環境変数参照
- Playwright は `--no-sandbox` で起動（root環境のため）
- Sharp composite でSVGを合成するため、SVG内の日本語はNoto Sans JPフォールバック
- ExcelJS の `addImage` は Buffer 型の互換性問題あり（`as never` キャスト使用）
