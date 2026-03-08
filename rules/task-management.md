# タスク管理

## ワークフロー

```
Plan → Verify Plan → Implement → Track → Document → Capture Lessons
```

1. **Plan First**: `tasks/todo.md` にチェック可能な項目で計画を書く
2. **Verify Plan**: 実装開始前にユーザーに確認
3. **Track Progress**: 完了した項目を随時マーク
4. **Explain Changes**: 各ステップで高レベルの概要を伝える
5. **Document Results**: `tasks/todo.md` にレビューセクションを追加
6. **Capture Lessons**: 修正を受けたら `tasks/lessons.md` を更新

## tasks/todo.md フォーマット

```markdown
# [タスク名]

## 計画
- [ ] ステップ1: 説明
- [ ] ステップ2: 説明
- [ ] ステップ3: 説明

## 検証
- [ ] テスト通過
- [ ] ビルド成功
- [ ] 動作確認

## レビュー
- 変更サマリー: ...
- 影響範囲: ...
- 残課題: ...
```

## tasks/lessons.md フォーマット

```markdown
# Lessons Learned

## [日付] [カテゴリ]
- **状況**: 何が起きたか
- **原因**: なぜ起きたか
- **教訓**: 次回どうするか
- **ルール**: 自動適用すべきルール
```

## ルール

- タスクディレクトリはプロジェクトルートの `tasks/` に配置
- `todo.md` は1タスクにつき1ファイル（大きなタスクは分割）
- `lessons.md` はプロジェクト単位で1ファイル
- セッション開始時に `lessons.md` を確認し、同じミスを繰り返さない

## コア原則

### Simplicity First（簡潔さ優先）
- 変更は可能な限りシンプルに
- 影響するコードを最小限に
- 必要なものだけを変更する

### No Laziness（手抜き禁止）
- 根本原因を見つける
- 一時的な修正はしない
- シニアデベロッパーの基準で

### Minimal Impact（最小影響）
- 必要な箇所だけ変更
- バグの導入を避ける
- 副作用を最小化する
