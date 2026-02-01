# スキル一覧

自動的に適用されるスキル（ワークフローパターン）の一覧

---

## tdd-workflow
**テスト駆動開発ワークフロー**

**トリガー:** 「実装」「機能追加」「新規開発」「バグ修正」

**サイクル:**
```
RED → GREEN → REFACTOR → REPEAT
```

**ステップ:**
1. SCAFFOLD: インターフェース定義
2. RED: 失敗するテストを書く
3. GREEN: 最小限の実装
4. REFACTOR: コード改善
5. カバレッジ80%+確認

---

## verification-loop
**検証ループ**

**トリガー:** 「実装完了」「コミット前」「PR前」

**ステップ:**
```
型チェック → リント → テスト → ビルド
```

**コマンド:**
```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
```

---

## security-review
**セキュリティレビュー**

**トリガー:** 「API」「認証」「DB」「ユーザー入力」

**チェック項目:**
- SQLインジェクション
- XSS
- 認証・認可
- 機密情報漏洩

---

## continuous-learning
**継続学習**

**トリガー:** セッション終了時

**プロセス:**
1. パターン抽出
2. instinctsとして保存
3. 関連パターンをクラスタリング
4. コマンド/スキル/エージェントに昇格

---

## スキルファイル一覧

```
~/.claude/skills/
├── tdd-workflow/SKILL.md
├── verification-loop/SKILL.md
├── security-review/SKILL.md
└── continuous-learning/SKILL.md
```
