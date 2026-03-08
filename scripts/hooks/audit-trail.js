#!/usr/bin/env node
/**
 * Audit Trail Hook
 *
 * 全ツール実行をSHA-256ハッシュチェーン付きJSONLで記録。
 * 各エントリは前エントリのハッシュを含み、改ざんを検出可能にする。
 *
 * 保存先: ~/.claude/audit/audit-trail.jsonl
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const {
  ensureDir,
  getClaudeDir,
} = require('../lib/utils');

const MAX_STDIN = 1024 * 1024;
const AUDIT_DIR_NAME = 'audit';
const AUDIT_FILE_NAME = 'audit-trail.jsonl';
const MAX_INPUT_PREVIEW = 512;

let raw = '';

/**
 * ファイルの最終行を取得
 */
function getLastLine(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8').trimEnd();
    if (!content) return null;
    const lines = content.split('\n');
    return lines[lines.length - 1];
  } catch {
    return null;
  }
}

/**
 * 前エントリのハッシュを取得
 */
function getPrevHash(filePath) {
  const lastLine = getLastLine(filePath);
  if (!lastLine) return '0'.repeat(64); // genesis
  try {
    const entry = JSON.parse(lastLine);
    return entry.hash || '0'.repeat(64);
  } catch {
    return '0'.repeat(64);
  }
}

/**
 * 次のシーケンス番号を取得
 */
function getNextSeq(filePath) {
  const lastLine = getLastLine(filePath);
  if (!lastLine) return 1;
  try {
    const entry = JSON.parse(lastLine);
    return (entry.seq || 0) + 1;
  } catch {
    return 1;
  }
}

/**
 * 入力データのハッシュを生成（機密情報を含めないプレビュー用）
 */
function hashInput(input) {
  const str = JSON.stringify(input);
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * エントリ全体のハッシュを生成
 */
function hashEntry(entry) {
  // hash フィールドを除いたエントリをハッシュ
  const { hash, ...rest } = entry;
  const str = JSON.stringify(rest);
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * ツール入力の安全なプレビューを生成（機密情報を除外）
 */
function safeInputPreview(toolInput) {
  if (!toolInput) return {};
  const preview = {};
  for (const [key, value] of Object.entries(toolInput)) {
    if (/password|secret|token|key|credential/i.test(key)) {
      preview[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > MAX_INPUT_PREVIEW) {
      preview[key] = value.substring(0, MAX_INPUT_PREVIEW) + '...[truncated]';
    } else {
      preview[key] = value;
    }
  }
  return preview;
}

/**
 * ツール結果のステータスを判定
 */
function determineResult(input) {
  if (input.tool_output?.is_error) return 'error';
  if (input.tool_output?.blocked) return 'blocked';
  return 'success';
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  if (raw.length < MAX_STDIN) {
    const remaining = MAX_STDIN - raw.length;
    raw += chunk.substring(0, remaining);
  }
});

process.stdin.on('end', () => {
  try {
    const input = raw.trim() ? JSON.parse(raw) : {};
    const tool = input.tool || input.tool_name || 'unknown';
    const toolInput = input.tool_input || {};

    const auditDir = path.join(getClaudeDir(), AUDIT_DIR_NAME);
    ensureDir(auditDir);
    const auditFile = path.join(auditDir, AUDIT_FILE_NAME);

    const prevHash = getPrevHash(auditFile);
    const seq = getNextSeq(auditFile);

    const entry = {
      seq,
      timestamp: new Date().toISOString(),
      session_id: process.env.CLAUDE_SESSION_ID || 'unknown',
      project: process.cwd(),
      tool,
      input_preview: safeInputPreview(toolInput),
      input_hash: hashInput(toolInput),
      result: determineResult(input),
      prev_hash: prevHash,
    };

    // エントリ自体のハッシュを計算して追加
    entry.hash = hashEntry(entry);

    fs.appendFileSync(auditFile, JSON.stringify(entry) + '\n');
  } catch {
    // フック自体がエラーでブロックしない
  }

  // パススルー
  process.stdout.write(raw);
});
