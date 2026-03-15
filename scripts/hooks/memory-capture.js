#!/usr/bin/env node
/**
 * Stop Hook - Auto Capture
 *
 * 各レスポンス後にトランスクリプトを解析し、
 * 記憶すべきパターン（決定・好み・事実・学習）を検出してLanceDBに保存する。
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

const DB_PATH = path.join(os.homedir(), '.local', 'share', 'memory-lancedb', 'lancedb');
const OLLAMA_URL = 'http://localhost:11434';
const OLLAMA_MODEL = 'nomic-embed-text';
const STATE_FILE = path.join(os.homedir(), '.local', 'share', 'memory-lancedb', '.capture-state.json');
const MAX_CONTENT_LEN = 500;

// 自動キャプチャトリガーパターン
const CAPTURE_PATTERNS = [
  { pattern: /覚えて|記憶して|メモして|remember|note that/i, category: 'fact' },
  { pattern: /好み(は|で)|prefer|いつも.*使う|デフォルトは/i, category: 'preference' },
  { pattern: /に決めた|に決定|decided|採用する|方針として/i, category: 'decision' },
  { pattern: /学んだ|わかった|教訓|lesson|注意点として/i, category: 'learning' },
  { pattern: /設定(は|を)|config|ポート|URL(は|:)|パス(は|:)/i, category: 'fact' },
];

function log(msg) {
  process.stderr.write(`[MemoryCapture] ${msg}\n`);
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

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return { lastProcessedLine: 0 };
  }
}

function saveState(state) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STATE_FILE, JSON.stringify(state), 'utf-8');
}

function extractUserMessages(transcriptPath, fromLine) {
  const content = fs.readFileSync(transcriptPath, 'utf-8');
  const lines = content.split('\n').filter(Boolean);
  const messages = [];

  for (let i = fromLine; i < lines.length; i++) {
    try {
      const entry = JSON.parse(lines[i]);
      const isUser = entry.type === 'user' || entry.role === 'user' || entry.message?.role === 'user';
      if (!isUser) continue;

      const rawContent = entry.message?.content ?? entry.content;
      const text = typeof rawContent === 'string'
        ? rawContent
        : Array.isArray(rawContent)
          ? rawContent.map(c => (c && c.text) || '').join(' ')
          : '';

      if (text.trim()) {
        messages.push({ text: text.trim(), lineIndex: i });
      }
    } catch {
      // skip
    }
  }

  return { messages, totalLines: lines.length };
}

function detectCapturableContent(messages) {
  const results = [];

  for (const msg of messages) {
    for (const { pattern, category } of CAPTURE_PATTERNS) {
      if (pattern.test(msg.text)) {
        const content = msg.text.slice(0, MAX_CONTENT_LEN);
        results.push({ content, category, lineIndex: msg.lineIndex });
        break; // 1メッセージにつき1キャプチャ
      }
    }
  }

  return results;
}

// stdin読み取り
const MAX_STDIN = 1024 * 1024;
let stdinData = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (stdinData.length < MAX_STDIN) {
    stdinData += chunk.substring(0, MAX_STDIN - stdinData.length);
  }
});
process.stdin.on('end', () => {
  main().catch(err => {
    log(`エラー: ${err.message}`);
    process.exit(0);
  });
});

async function main() {
  // トランスクリプトパスを取得
  let transcriptPath = null;
  try {
    const input = JSON.parse(stdinData);
    transcriptPath = input.transcript_path;
  } catch {
    transcriptPath = process.env.CLAUDE_TRANSCRIPT_PATH;
  }

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    process.exit(0);
  }

  // Ollamaチェック
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) throw new Error();
  } catch {
    process.exit(0); // Ollama未稼働なら静かに終了
  }

  // LanceDB
  let lancedb;
  try {
    lancedb = require(path.join(process.env.HOME + '/memory-lancedb-mcp/node_modules/@lancedb/lancedb'));
  } catch {
    process.exit(0);
  }

  const state = loadState();
  const { messages, totalLines } = extractUserMessages(transcriptPath, state.lastProcessedLine);

  if (messages.length === 0) {
    saveState({ lastProcessedLine: totalLines });
    process.exit(0);
  }

  const capturable = detectCapturableContent(messages);
  if (capturable.length === 0) {
    saveState({ lastProcessedLine: totalLines });
    process.exit(0);
  }

  try {
    const db = await lancedb.connect(DB_PATH);
    let table;
    const tableNames = await db.tableNames();

    for (const item of capturable) {
      const vector = await ollamaEmbed(item.content);
      if (!vector) continue;

      const entry = {
        id: require('crypto').randomUUID(),
        content: item.content,
        category: item.category,
        scope: 'global',
        tags: '["auto-capture"]',
        importance: 6,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: 'auto-capture',
        vector,
      };

      if (tableNames.includes('memories')) {
        if (!table) table = await db.openTable('memories');
        await table.add([entry]);
      } else {
        table = await db.createTable('memories', [entry]);
        tableNames.push('memories');
      }

      log(`自動保存: [${item.category}] ${item.content.slice(0, 60)}...`);
    }

    saveState({ lastProcessedLine: totalLines });
    log(`${capturable.length}件を自動キャプチャ`);
  } catch (err) {
    log(`DB書込エラー: ${err.message}`);
  }

  process.exit(0);
}
