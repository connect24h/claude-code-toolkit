/**
 * Google Calendar 書き込み権限を取得するための認証スクリプト
 *
 * 使い方:
 * 1. npx tsx scripts/google-auth.ts を実行
 * 2. 表示されたURLをブラウザで開く
 * 3. Googleアカウント (connect24h.now@gmail.com) でログイン
 * 4. 権限を承認
 * 5. リダイレクト先URLの ?code= パラメータをコピー
 * 6. ターミナルに貼り付けてEnter
 */

import { google } from 'googleapis';
import { createInterface } from 'readline';
import { readFileSync, writeFileSync } from 'fs';
import { createServer } from 'http';

const CREDENTIALS_FILE = '/root/.config/google-workspace-mcp/credentials.json';
const TOKENS_FILE = '/root/.config/google-workspace-mcp/tokens.json';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/gmail.readonly',
];

async function main(): Promise<void> {
  const creds = JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf-8'));
  const { client_id, client_secret } = creds.installed ?? creds.web;

  const oauth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    'http://localhost:3333'
  );

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  console.log('\n=== Google Calendar 書き込み権限の認証 ===\n');
  console.log('以下のURLをブラウザで開いてください:\n');
  console.log(authUrl);
  console.log('\n認証コールバックを待機中 (http://localhost:3333)...\n');

  // ローカルサーバーでコールバックを受け取る
  const code = await new Promise<string>((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '', 'http://localhost:3333');
      console.log('リクエスト受信:', req.url);
      const authCode = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<h1>認証エラー</h1><p>${error}</p>`);
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (authCode) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h1>認証成功！</h1><p>このウィンドウを閉じてください。</p>');
        server.close();
        resolve(authCode);
      } else {
        // favicon等のリクエストは無視
        res.writeHead(200);
        res.end('waiting for auth...');
      }
    });

    server.listen(3333, () => {
      console.log('ポート3333でコールバック待機中...');
    });

    // 5分タイムアウト
    setTimeout(() => {
      server.close();
      reject(new Error('認証タイムアウト (5分)'));
    }, 300000);
  });

  console.log('認証コード取得。トークン交換中...');

  const { tokens } = await oauth2Client.getToken(code);
  console.log('\n新しいトークン取得成功！');
  console.log('スコープ:', tokens.scope);

  // 既存トークンファイルを更新
  const existingTokens = JSON.parse(readFileSync(TOKENS_FILE, 'utf-8'));
  const updatedTokens = { ...existingTokens, ...tokens };
  writeFileSync(TOKENS_FILE, JSON.stringify(updatedTokens, null, 2));
  console.log('\nトークンファイル更新完了:', TOKENS_FILE);

  // mail-to-slackの.env.encも更新が必要
  if (tokens.refresh_token) {
    console.log('\n[重要] refresh_tokenが更新されました。');
    console.log('新しいrefresh_token:', tokens.refresh_token);
    console.log('\n.env.encのGOOGLE_REFRESH_TOKENも更新してください。');
  }
}

main().catch(err => {
  console.error('エラー:', err);
  process.exit(1);
});
