#!/usr/bin/env node
/**
 * SessionStart Hook - Auto Recall
 *
 * セッション開始時にLanceDBから最近の重要な記憶を取得し、
 * コンテキストとしてClaudeに注入する。
 */

const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const DB_PATH = path.join(os.homedir(), '.local', 'share', 'memory-lancedb', 'lancedb');
const OLLAMA_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'nomic-embed-text';
const MAX_MEMORIES = 5;

function log(msg) {
  process.stderr.write(`[MemoryRecall] ${msg}\n`);
}

async function ollamaEmbed(text) {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: OLLAMA_MODEL, input: text }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.embeddings?.[0] ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const fs = require('fs');

  // LanceDBが存在しなければスキップ
  if (!fs.existsSync(DB_PATH)) {
    log('DB未初期化 - スキップ');
    process.exit(0);
  }

  // Ollamaが起動しているか確認
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) throw new Error('not ok');
  } catch {
    log('Ollama未稼働 - スキップ');
    process.exit(0);
  }

  // LanceDBを動的インポート
  let lancedb;
  try {
    lancedb = require(path.join('/root/memory-lancedb-mcp/node_modules/@lancedb/lancedb'));
  } catch {
    log('LanceDBモジュールのロード失敗 - スキップ');
    process.exit(0);
  }

  try {
    const db = await lancedb.connect(DB_PATH);
    const tableNames = await db.tableNames();
    if (!tableNames.includes('memories')) {
      log('memoriesテーブルなし - スキップ');
      process.exit(0);
    }

    const table = await db.openTable('memories');

    // 最近の重要な記憶をクエリ（全件取得して上位をフィルタ）
    const all = await table.query().limit(100).toArray();
    const entries = all
      .filter(r => r.content !== '__init__')
      .map(r => ({
        content: r.content,
        category: r.category,
        importance: r.importance,
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags,
        createdAt: r.createdAt,
      }))
      .sort((a, b) => {
        // 重要度 × 新しさでソート
        const impDiff = (b.importance || 5) - (a.importance || 5);
        if (impDiff !== 0) return impDiff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, MAX_MEMORIES);

    if (entries.length === 0) {
      log('記憶なし - スキップ');
      process.exit(0);
    }

    // コンテキストとして出力
    const lines = ['<relevant-memories>'];
    for (const e of entries) {
      const tags = (e.tags || []).join(', ');
      lines.push(`- [${e.category}] (重要度:${e.importance}) ${e.content}${tags ? ` [tags: ${tags}]` : ''}`);
    }
    lines.push('</relevant-memories>');

    // stdoutに出力 → Claudeのコンテキストに注入
    process.stdout.write(lines.join('\n') + '\n');
    log(`${entries.length}件の記憶を注入`);
  } catch (err) {
    log(`エラー: ${err.message}`);
  }

  process.exit(0);
}

main().catch(err => {
  log(`致命的エラー: ${err.message}`);
  process.exit(0);
});
