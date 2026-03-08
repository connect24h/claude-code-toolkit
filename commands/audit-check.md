# /audit-check - 監査証跡チェック

監査証跡のハッシュチェーン整合性を検証し、改ざんを検出する。

## 使い方

```
/audit-check              # 全件チェック + レポート表示
/audit-check --last 100   # 最新100件のみチェック
/audit-check --slack      # 異常検出時にSlack通知
```

## 実行内容

1. `~/.claude/audit/audit-trail.jsonl` を読み込む
2. 各エントリのSHA-256ハッシュを再計算し、記録値と比較
3. prev_hash チェーンの連続性を検証
4. シーケンス番号の連続性を検証
5. 結果をレポート表示（ツール別統計、異常詳細）
6. `--slack` 指定時、異常があればSlack通知

## 実行コマンド

```bash
node /root/.claude/scripts/hooks/audit-verify.js
```

異常が検出された場合は終了コード1を返す。
