#!/usr/bin/env node
/**
 * Audit Trail Verifier
 *
 * ハッシュチェーンの整合性を検証し、改ざんを検出する。
 *
 * 使い方:
 *   node audit-verify.js                  # 全件チェック
 *   node audit-verify.js --last 100       # 最新100件チェック
 *   node audit-verify.js --slack          # 異常検出時にSlack通知
 *   node audit-verify.js --summary        # サマリーのみ表示
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const AUDIT_DIR = path.join(process.env.HOME || '/root', '.claude', 'audit');
const AUDIT_FILE = path.join(AUDIT_DIR, 'audit-trail.jsonl');

// コマンドライン引数
const args = process.argv.slice(2);
const slackNotify = args.includes('--slack');
const summaryOnly = args.includes('--summary');
const lastIdx = args.indexOf('--last');
const lastN = lastIdx !== -1 ? parseInt(args[lastIdx + 1], 10) : 0;

/**
 * エントリのハッシュを再計算
 */
function computeHash(entry) {
  const { hash, ...rest } = entry;
  return crypto.createHash('sha256').update(JSON.stringify(rest)).digest('hex');
}

/**
 * Slack通知を送信
 */
function sendSlackAlert(message) {
  try {
    // SOPS経由でSlack webhook URLを取得
    const envPath = path.join(process.env.HOME || '/root', 'mail-to-slack', '.env.enc');
    if (!fs.existsSync(envPath)) {
      process.stderr.write('[audit-verify] .env.enc が見つかりません。Slack通知をスキップ\n');
      return;
    }
    const decrypted = execSync(`sops -d ${envPath} 2>/dev/null`, { encoding: 'utf8' });
    const match = decrypted.match(/SLACK_TOKEN=(.+)/);
    const channelMatch = decrypted.match(/SLACK_CHANNEL=(.+)/);
    if (!match || !channelMatch) return;

    const token = match[1].trim();
    const channel = channelMatch[1].trim();

    const payload = JSON.stringify({
      channel,
      text: message,
    });

    execSync(`curl -s -X POST https://slack.com/api/chat.postMessage -H "Authorization: Bearer ${token}" -H "Content-Type: application/json" -d '${payload.replace(/'/g, "'\\''")}'`, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  } catch {
    process.stderr.write('[audit-verify] Slack通知に失敗\n');
  }
}

/**
 * メイン検証ロジック
 */
function verify() {
  if (!fs.existsSync(AUDIT_FILE)) {
    console.log('[audit-verify] 監査ログファイルが存在しません: ' + AUDIT_FILE);
    process.exit(0);
  }

  const content = fs.readFileSync(AUDIT_FILE, 'utf8').trimEnd();
  if (!content) {
    console.log('[audit-verify] 監査ログが空です');
    process.exit(0);
  }

  let lines = content.split('\n');
  const totalEntries = lines.length;

  // --last N の場合、最後のN件のみチェック（ただしチェーン検証のため1つ前も読む）
  let startIdx = 0;
  if (lastN > 0 && lastN < lines.length) {
    startIdx = lines.length - lastN;
  }

  const errors = [];
  const stats = {
    total: totalEntries,
    checked: 0,
    valid: 0,
    invalid: 0,
    tools: {},
    results: { success: 0, error: 0, blocked: 0 },
    firstTimestamp: null,
    lastTimestamp: null,
  };

  let prevHash = null;

  for (let i = 0; i < lines.length; i++) {
    let entry;
    try {
      entry = JSON.parse(lines[i]);
    } catch {
      if (i >= startIdx) {
        errors.push({ line: i + 1, type: 'PARSE_ERROR', message: 'JSONパースに失敗' });
      }
      continue;
    }

    // 統計情報を収集（全件）
    if (i === 0) stats.firstTimestamp = entry.timestamp;
    stats.lastTimestamp = entry.timestamp;
    stats.tools[entry.tool] = (stats.tools[entry.tool] || 0) + 1;
    if (entry.result) stats.results[entry.result] = (stats.results[entry.result] || 0) + 1;

    // チェック対象外の行は prevHash だけ更新
    if (i < startIdx) {
      prevHash = entry.hash;
      continue;
    }

    stats.checked++;

    // 1. ハッシュの整合性チェック
    const expectedHash = computeHash(entry);
    if (entry.hash !== expectedHash) {
      stats.invalid++;
      errors.push({
        line: i + 1,
        seq: entry.seq,
        type: 'HASH_MISMATCH',
        message: `ハッシュ不一致: expected=${expectedHash.substring(0, 16)}... actual=${(entry.hash || '').substring(0, 16)}...`,
        timestamp: entry.timestamp,
      });
    } else {
      stats.valid++;
    }

    // 2. チェーンの連続性チェック
    if (prevHash !== null && entry.prev_hash !== prevHash) {
      errors.push({
        line: i + 1,
        seq: entry.seq,
        type: 'CHAIN_BREAK',
        message: `チェーン断絶: expected_prev=${prevHash.substring(0, 16)}... actual_prev=${(entry.prev_hash || '').substring(0, 16)}...`,
        timestamp: entry.timestamp,
      });
    }

    // 3. シーケンス番号の連続性チェック
    if (i > 0) {
      try {
        const prevEntry = JSON.parse(lines[i - 1]);
        if (entry.seq !== prevEntry.seq + 1) {
          errors.push({
            line: i + 1,
            seq: entry.seq,
            type: 'SEQ_GAP',
            message: `シーケンス番号不連続: prev=${prevEntry.seq} current=${entry.seq}`,
            timestamp: entry.timestamp,
          });
        }
      } catch {
        // 前行パースエラーは別で検出済み
      }
    }

    prevHash = entry.hash;
  }

  // 結果出力
  if (summaryOnly) {
    printSummary(stats, errors);
  } else {
    printFullReport(stats, errors);
  }

  // Slack通知（異常検出時のみ）
  if (slackNotify && errors.length > 0) {
    const alertMsg = [
      ':rotating_light: *監査証跡 整合性チェック - 異常検出*',
      `検出された問題: ${errors.length}件`,
      `チェック範囲: ${stats.checked}/${stats.total}件`,
      '',
      errors.slice(0, 5).map(e => `- [${e.type}] seq=${e.seq || '?'} ${e.message}`).join('\n'),
      errors.length > 5 ? `...他 ${errors.length - 5}件` : '',
    ].join('\n');
    sendSlackAlert(alertMsg);
    console.log('\n[Slack] 異常通知を送信しました');
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

function printSummary(stats, errors) {
  console.log('=== 監査証跡チェック サマリー ===');
  console.log(`期間: ${stats.firstTimestamp || 'N/A'} ~ ${stats.lastTimestamp || 'N/A'}`);
  console.log(`総エントリ: ${stats.total} / チェック: ${stats.checked}`);
  console.log(`有効: ${stats.valid} / 無効: ${stats.invalid}`);
  console.log(`問題: ${errors.length}件`);
  if (errors.length === 0) {
    console.log('ステータス: OK - 改ざんなし');
  } else {
    console.log('ステータス: NG - 改ざんまたは破損を検出');
  }
}

function printFullReport(stats, errors) {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║       監査証跡 整合性チェックレポート        ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`期間: ${stats.firstTimestamp || 'N/A'}`);
  console.log(`    ~ ${stats.lastTimestamp || 'N/A'}`);
  console.log(`総エントリ数: ${stats.total}`);
  console.log(`チェック対象: ${stats.checked}`);
  console.log(`  有効: ${stats.valid}`);
  console.log(`  無効: ${stats.invalid}`);
  console.log('');

  // ツール別統計
  console.log('--- ツール別実行回数 ---');
  const sortedTools = Object.entries(stats.tools).sort((a, b) => b[1] - a[1]);
  for (const [tool, count] of sortedTools.slice(0, 15)) {
    console.log(`  ${tool}: ${count}`);
  }
  console.log('');

  // 結果別統計
  console.log('--- 実行結果 ---');
  console.log(`  成功: ${stats.results.success || 0}`);
  console.log(`  エラー: ${stats.results.error || 0}`);
  console.log(`  ブロック: ${stats.results.blocked || 0}`);
  console.log('');

  // エラー詳細
  if (errors.length === 0) {
    console.log('=== 結果: OK - ハッシュチェーン整合性確認済み ===');
  } else {
    console.log(`=== 結果: NG - ${errors.length}件の問題を検出 ===`);
    console.log('');
    for (const err of errors) {
      console.log(`  [行${err.line}] ${err.type}: ${err.message}`);
      if (err.timestamp) console.log(`           時刻: ${err.timestamp}`);
    }
  }
}

verify();
