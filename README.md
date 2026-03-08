# Claude Code Toolkit

Claude Code CLI を統括エージェントとして活用するための包括的ツールキット。
ソフトウェア開発、プロダクトマネジメント、自動化を一元管理します。

## 概要

| カテゴリ | 数量 | 説明 |
|----------|------|------|
| **スキル** | 13カテゴリ (PM: 8サブカテゴリ) | 再利用可能なワークフロー定義 |
| **コマンド** | 52 (コア: 16, PM: 36) | スラッシュコマンド (`/plan`, `/tdd` 等) |
| **エージェント** | 10 | 専門特化サブエージェント |
| **ルール** | 9 | コーディング規約・セキュリティポリシー |
| **フック** | 8 | セッション管理・コスト追跡・メモリ |

## ディレクトリ構成

```
claude-code-toolkit/
├── CLAUDE.md                  # メイン設定ファイル
├── README.md                  # このファイル
├── install.sh                 # インストーラー
├── settings.json.example      # MCP設定テンプレート
├── skills/                    # スキル定義
│   ├── continuous-learning/   # 継続学習
│   ├── layout-fix/            # レイアウト修正
│   ├── learned/               # 学習済みパターン
│   ├── manual-generator/      # マニュアル生成
│   ├── moneyforward-observer/ # MoneyForward監視
│   ├── pm/                    # PMスキル群
│   │   ├── pm-data-analytics/
│   │   ├── pm-execution/
│   │   ├── pm-go-to-market/
│   │   ├── pm-market-research/
│   │   ├── pm-marketing-growth/
│   │   ├── pm-product-discovery/
│   │   ├── pm-product-strategy/
│   │   └── pm-toolkit/
│   ├── security-audit/        # セキュリティ監査
│   ├── security-review/       # セキュリティレビュー
│   ├── slide-style-rector/    # スライドスタイル
│   ├── svg-creator/           # SVG生成
│   ├── tdd-workflow/          # TDDワークフロー
│   ├── verification-loop/     # 検証ループ
│   └── youtube-channel-observer/ # YouTube監視
├── commands/                  # スラッシュコマンド (52)
├── agents/                    # サブエージェント (10)
├── rules/                     # ルール定義 (9)
├── hooks/
│   └── hooks.json             # フック設定
├── scripts/
│   ├── hooks/                 # フックハンドラー (JS)
│   ├── lib/                   # ユーティリティ
│   ├── memory-lancedb-mcp.sh  # Memory MCP起動
│   └── google-workspace-mcp.sh # Google Workspace MCP起動
├── docs/                      # ドキュメント
└── examples/
    ├── youtube-observer/      # YouTube定点観測
    └── mail-to-slack/         # メール→Slack通知
```

## インストール

### 方法1: 自動インストール

```bash
git clone https://github.com/connect24h/claude-code-toolkit.git
cd claude-code-toolkit
chmod +x install.sh
./install.sh
```

インストーラーは `~/.claude/` 配下に全ファイルをコピーします。
既存の設定がある場合はバックアップを自動作成します。

### 方法2: 手動インストール

```bash
# 各ディレクトリを ~/.claude/ にコピー
cp -r agents/* ~/.claude/agents/
cp -r commands/* ~/.claude/commands/
cp -r skills/* ~/.claude/skills/
cp -r rules/* ~/.claude/rules/
cp hooks/hooks.json ~/.claude/hooks/
cp -r scripts/hooks/* ~/.claude/scripts/hooks/
cp -r scripts/lib/* ~/.claude/scripts/lib/
cp CLAUDE.md ~/.claude/
```

## コマンド一覧

### コア開発コマンド (16)

| コマンド | 説明 |
|----------|------|
| `/plan` | 実装計画を作成 |
| `/tdd` | テスト駆動開発ワークフロー |
| `/verify` | 検証ループ（ビルド・テスト・型チェック） |
| `/code-review` | コードレビュー |
| `/build-fix` | ビルドエラー自動解決 |
| `/security-audit` | セキュリティ監査 |
| `/refactor-clean` | リファクタリング |
| `/test-coverage` | テストカバレッジ確認 |
| `/quality-gate` | 品質ゲートチェック |
| `/evolve` | パターン昇格 |
| `/orchestrate` | タスクオーケストレーション |
| `/delegate-codex` | Codex CLIに委譲 |
| `/delegate-gemini` | Gemini CLIに委譲 |
| `/marp` | Marpスライド作成 |
| `/monitor` | 監視 |
| `/checkpoint` | チェックポイント保存 |

### PMコマンド (36)

プロダクトマネジメント全領域をカバーする36のコマンド:

| カテゴリ | コマンド例 |
|----------|-----------|
| **戦略** | `/pm-strategy`, `/pm-north-star`, `/pm-plan-okrs` |
| **発見** | `/pm-discover`, `/pm-research-users`, `/pm-interview` |
| **市場分析** | `/pm-competitive-analysis`, `/pm-market-scan`, `/pm-battlecard` |
| **プロダクト** | `/pm-write-prd`, `/pm-write-stories`, `/pm-pricing` |
| **実行** | `/pm-sprint`, `/pm-triage-requests`, `/pm-meeting-notes` |
| **GTM** | `/pm-plan-launch`, `/pm-growth-strategy`, `/pm-market-product` |
| **データ** | `/pm-analyze-cohorts`, `/pm-analyze-feedback`, `/pm-setup-metrics` |
| **その他** | `/pm-brainstorm`, `/pm-pre-mortem`, `/pm-proofread` |

## エージェント (10)

| エージェント | 説明 |
|-------------|------|
| `planner` | 実装計画立案 |
| `tdd-guide` | TDDガイド |
| `code-reviewer` | コードレビュー |
| `orchestrator` | タスクオーケストレーション |
| `security-auditor` | セキュリティ監査 |
| `security-reviewer` | セキュリティレビュー |
| `build-error-resolver` | ビルドエラー解決 |
| `doc-updater` | ドキュメント更新 |
| `codex-delegate` | Codex CLI委譲 |
| `gemini-delegate` | Gemini CLI委譲 |

## ルール (9)

| ルール | 説明 |
|--------|------|
| `app-persona.md` | アプリ開発ペルソナ定義 |
| `coding-style.md` | コーディングスタイル（TypeScript必須） |
| `git-workflow.md` | Gitワークフロー（日本語コミット） |
| `mail-server.md` | メールサーバー設定保護 |
| `performance.md` | パフォーマンス最適化 |
| `security.md` | セキュリティルール |
| `task-management.md` | タスク管理ワークフロー |
| `testing.md` | テストルール（Vitest） |
| `workflow-orchestration.md` | ワークフローオーケストレーション |

## フックシステム

`hooks/hooks.json` で定義されるフック:

### PreToolUse フック
- **dev server推奨**: `npm run dev` 実行時にtmux使用を推奨
- **ドキュメント警告**: 不要なドキュメントファイル作成を検出
- **force pushブロック**: `git push --force` を禁止
- **.env読み取りブロック**: 平文.envの直接読み取りを禁止（SOPS経由を強制）
- **メールサーバー保護**: メールサーバー設定変更をブロック
- **システム設定警告**: `/etc/` 配下の設定変更を警告
- **コンパクト推奨**: ツール呼び出し回数を追跡し `/compact` を推奨

### PostToolUse フック
- **Agent Trace**: ファイル変更を追跡
- **console.log警告**: TypeScript編集後にconsole.logの残留を検出
- **PR URL表示**: PR作成時にURLを表示
- **型チェック**: TypeScriptファイル編集後に自動型チェック

### SessionStart フック
- **コンテキスト読み込み**: 前回のセッション状態を復元
- **メモリ想起**: LanceDBから関連する記憶を自動注入

### PreCompact / Stop / SessionEnd フック
- **状態保存**: コンパクト前にセッション状態を保存
- **セッション永続化**: レスポンス後にセッション状態を保存
- **パターン評価**: セッションから学習パターンを抽出
- **メモリ保存**: 会話からキーワードを検出しLanceDBに保存
- **コスト追跡**: トークン使用量・コストを `~/.claude/metrics/costs.jsonl` に記録

## フックハンドラー (scripts/hooks/)

| ファイル | 説明 |
|----------|------|
| `session-start.js` | セッション開始時の初期化処理 |
| `memory-recall.js` | LanceDBからの記憶想起 |
| `suggest-compact.js` | `/compact` 推奨タイミング判定 |
| `pre-compact.js` | コンパクト前の状態保存 |
| `session-end.js` | セッション状態の永続化 |
| `evaluate-session.js` | 学習パターンの評価・抽出 |
| `memory-capture.js` | 会話からのメモリ自動保存 |
| `cost-tracker.js` | トークンコスト追跡 |

## ユーティリティ (scripts/lib/)

| ファイル | 説明 |
|----------|------|
| `decrypt-env.sh` | SOPS暗号化.envの復号 |
| `hook-flags.js` | フックフラグ管理 |
| `package-manager.js` | パッケージマネージャー検出 |
| `project-detect.js` | プロジェクト情報検出 |
| `session-aliases.js` | セッションエイリアス管理 |
| `session-manager.js` | セッション状態管理 |
| `utils.js` | 汎用ユーティリティ |

## MCPサーバー設定

`settings.json.example` をベースに `~/.claude/settings.json` を作成してください。

### 対応MCPサーバー

| サーバー | 説明 |
|----------|------|
| **Playwright** | ブラウザ操作・E2Eテスト |
| **Sequential Thinking** | 段階的思考プロセス |
| **Filesystem** | ファイルシステムアクセス |
| **Fetch** | HTTP/HTTPS取得 |
| **Memory (LanceDB)** | ベクトルDB記憶システム |
| **Google Workspace** | Gmail, Drive, Calendar連携 |

### メモリシステム (LanceDB)

ベクトルDBベースの記憶システム:
- セッション間で知識を自動保存・想起
- 複数のEmbeddingプロバイダー対応 (Ollama, OpenAI, Gemini, Voyage)
- セッション開始時に関連記憶を自動注入

## ワークフロー

### 実装フロー
```
/plan → ユーザー確認 → /tdd → /verify → /code-review → コミット
```

### タスク委譲
| 複雑度 | 担当 | コマンド |
|--------|------|---------|
| 低 | Codex CLI | `/delegate-codex` |
| 中 | Gemini CLI | `/delegate-gemini` |
| 高 | Claude Code | 直接実行 |
| 自動判定 | - | `/orchestrate` |

### 学習ループ
1. ユーザー修正後 → `tasks/lessons.md` に記録
2. 完了前 → 必ず動作を証明（テスト・ログ・デモ）
3. 非自明タスク → 必ずプランモードで開始

## サンプルプロジェクト

### examples/youtube-observer/
YouTube チャンネルの定点観測・要約自動化

### examples/mail-to-slack/
メール受信 → Slack通知 + Teams会議 → Googleカレンダー登録

## 前提条件

- Claude Code CLI
- Codex CLI (オーケストレーション用、任意) - [セットアップガイド](docs/CODEX-GEMINI-SETUP.md)
- Gemini CLI (オーケストレーション用、任意) - [セットアップガイド](docs/CODEX-GEMINI-SETUP.md)

### CLIインストール

```bash
# Codex CLI (OpenAI)
npm install -g @openai/codex
codex login

# Gemini CLI (Google)
npm install -g @google/gemini-cli
gemini  # 初回実行で認証
```

## セキュリティ

- 機密情報はSOPS + age暗号化で管理
- 平文の `.env` ファイルは使用禁止
- フックで `.env` 直接読み取りをブロック
- `settings.json` にはAPIキーを直接記載しない

## ライセンス

MIT License

## 貢献

Issue、Pull Requestを歓迎します。

## 作者

connect24h
