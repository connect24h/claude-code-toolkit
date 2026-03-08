import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`環境変数 ${key} が設定されていません`);
  }
  return value;
}

export const CONFIG = {
  // IMAP
  imapHost: () => process.env['IMAP_HOST'] ?? 'mail.cojp.online',
  imapPort: () => Number(process.env['IMAP_PORT'] ?? '993'),
  imapUser: () => requireEnv('IMAP_USER'),
  imapPassword: () => requireEnv('IMAP_PASSWORD'),

  // Slack
  slackBotToken: () => requireEnv('SLACK_BOT_TOKEN'),
  slackChannelId: () => process.env['SLACK_CHANNEL_ID'] ?? 'C0AH8CMPEL8',

  // Google Calendar
  googleClientId: () => requireEnv('GOOGLE_CLIENT_ID'),
  googleClientSecret: () => requireEnv('GOOGLE_CLIENT_SECRET'),
  googleRefreshToken: () => requireEnv('GOOGLE_REFRESH_TOKEN'),
  googleCalendarId: () => process.env['GOOGLE_CALENDAR_ID'] ?? 'connect24h.now@gmail.com',

  // Paths
  dataDir: resolve(__dirname, '..', 'data'),
  logsDir: resolve(__dirname, '..', 'logs'),
  stateFile: resolve(__dirname, '..', 'data', 'last-uid.json'),
} as const;
