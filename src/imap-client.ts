import { ImapFlow } from 'imapflow';
import { simpleParser, ParsedMail } from 'mailparser';
import { CONFIG } from './config.js';
import type { MailMessage } from './types.js';

function isTeamsMeeting(subject: string, body: string): boolean {
  const patterns = [
    /microsoft teams/i,
    /teams meeting/i,
    /teams 会議/i,
    /teams ミーティング/i,
    /join.*teams/i,
  ];
  const text = `${subject} ${body}`;
  return patterns.some(p => p.test(text));
}

function extractIcs(parsed: ParsedMail): string | undefined {
  if (!parsed.attachments) return undefined;
  const icsAttachment = parsed.attachments.find(
    a => a.contentType === 'text/calendar' || a.filename?.endsWith('.ics')
  );
  if (icsAttachment) {
    return icsAttachment.content.toString('utf-8');
  }

  // ICSが本文に埋め込まれている場合
  const textContent = parsed.text ?? '';
  const icsMatch = textContent.match(/BEGIN:VCALENDAR[\s\S]*?END:VCALENDAR/);
  return icsMatch?.[0];
}

export async function fetchNewMails(sinceUid: number): Promise<MailMessage[]> {
  const client = new ImapFlow({
    host: CONFIG.imapHost(),
    port: CONFIG.imapPort(),
    secure: true,
    auth: {
      user: CONFIG.imapUser(),
      pass: CONFIG.imapPassword(),
    },
    logger: false,
    tls: {
      rejectUnauthorized: false,
    },
  });

  const messages: MailMessage[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');

    try {
      // 全メッセージのUIDを軽量に取得
      const newUids: number[] = [];
      for await (const msg of client.fetch('1:*', { uid: true })) {
        if (msg.uid > sinceUid) {
          newUids.push(msg.uid);
        }
      }

      if (newUids.length === 0) {
        return [];
      }

      // 新着メールのソースを1件ずつ取得
      for (const uid of newUids) {
        try {
          const downloaded = await client.download(String(uid), undefined, { uid: true });
          if (!downloaded?.content) continue;

          const chunks: Buffer[] = [];
          for await (const chunk of downloaded.content) {
            chunks.push(Buffer.from(chunk));
          }
          const source = Buffer.concat(chunks);
          const parsed = await simpleParser(source) as unknown as ParsedMail;

          const body = parsed.text ?? '';
          const subject = parsed.subject ?? '(件名なし)';
          const from = parsed.from?.text ?? '(不明)';
          const date = parsed.date ?? new Date();
          const teamsMeeting = isTeamsMeeting(subject, body);

          messages.push({
            uid,
            from,
            subject,
            date,
            body: body.slice(0, 2000),
            isTeamsMeeting: teamsMeeting,
            icsData: teamsMeeting ? extractIcs(parsed) : undefined,
          });
        } catch {
          process.stderr.write(`[IMAP] UID ${uid} のダウンロード失敗、スキップ\n`);
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    process.stderr.write(`[IMAP] エラー: ${error.message}\n`);
    // 範囲外UIDの場合のみ空配列を返す
    if (error.message.includes('Invalid messageset')) {
      return [];
    }
    throw error;
  }

  return messages.sort((a, b) => a.uid - b.uid);
}
