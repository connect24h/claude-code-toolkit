---
name: git-workflow
description: Gitワークフローのルール
---

# Git ワークフロー

## ブランチ

- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 機能開発
- `bugfix/*`: バグ修正
- `hotfix/*`: 緊急修正

## コミット

### メッセージ形式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### タイプ
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: フォーマット
- `refactor`: リファクタリング
- `test`: テスト
- `chore`: その他

### 例
```
feat(auth): add OAuth2 login

- Add Google OAuth2 provider
- Add login button to header
- Store tokens in session

Closes #123
```

## 禁止事項

- `main` への直接プッシュ
- `--force` プッシュ
- 機密情報のコミット
- 大きすぎるコミット

## 推奨事項

- 小さく頻繁なコミット
- 意味のある単位でコミット
- コミット前にテスト実行
- PRでレビューを受ける
