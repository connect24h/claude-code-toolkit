import { WebClient } from '@slack/web-api';
import { CONFIG } from './config.js';
import type { MailMessage, TeamsEvent } from './types.js';

function formatDate(date: Date): string {
  return date.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + '...';
}

function buildMailBlocks(mails: MailMessage[]): Record<string, unknown>[] {
  const blocks: Record<string, unknown>[] = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📬 新着メール (${mails.length}件)` },
    },
    { type: 'divider' },
  ];

  for (const mail of mails) {
    const teamsTag = mail.isTeamsMeeting ? ' 🟣Teams会議' : '';
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `*${truncate(mail.subject, 200)}*${teamsTag}`,
          `📤 ${truncate(mail.from, 100)}`,
          `🕐 ${formatDate(mail.date)}`,
          `> ${truncate(mail.body.replace(/\n/g, ' '), 300)}`,
        ].join('\n'),
      },
    });
    blocks.push({ type: 'divider' });
  }

  return blocks;
}

function buildCalendarNotification(event: TeamsEvent): Record<string, unknown>[] {
  const lines = [
    `*${event.title}*`,
    `📅 ${event.startTime} ～ ${event.endTime}`,
    `👤 ${event.organizer}`,
  ];
  if (event.joinUrl) {
    lines.push(`🔗 <${event.joinUrl}|Teams参加リンク>`);
  }
  if (event.location) {
    lines.push(`📍 ${event.location}`);
  }

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '✅ Googleカレンダーに登録しました',
      },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: lines.join('\n') },
    },
  ];
}

export async function postNewMails(mails: MailMessage[]): Promise<void> {
  if (mails.length === 0) return;

  const client = new WebClient(CONFIG.slackBotToken());
  const blocks = buildMailBlocks(mails);

  // Slackブロック制限(50)を超える場合は分割
  const chunkSize = 48;
  for (let i = 0; i < blocks.length; i += chunkSize) {
    await client.chat.postMessage({
      channel: CONFIG.slackChannelId(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      blocks: blocks.slice(i, i + chunkSize) as never,
      text: `新着メール ${mails.length}件`,
    });
  }
}

export async function postCalendarRegistration(event: TeamsEvent): Promise<void> {
  const client = new WebClient(CONFIG.slackBotToken());
  const blocks = buildCalendarNotification(event);

  await client.chat.postMessage({
    channel: CONFIG.slackChannelId(),
    blocks: blocks as never,
    text: `Googleカレンダー登録: ${event.title}`,
  });
}
