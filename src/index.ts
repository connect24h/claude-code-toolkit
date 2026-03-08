import { fetchNewMails } from './imap-client.js';
import { parseTeamsMeeting } from './teams-parser.js';
import { postNewMails, postCalendarRegistration } from './slack.js';
import { registerToCalendar } from './calendar.js';
import { loadState, saveState } from './state.js';

function log(msg: string): void {
  const timestamp = new Date().toISOString();
  process.stderr.write(`[${timestamp}] ${msg}\n`);
}

async function main(): Promise<void> {
  log('メールチェック開始');

  const state = loadState();
  log(`前回のUID: ${state.lastUid}`);

  // 1. 新着メール取得
  const mails = await fetchNewMails(state.lastUid);

  if (mails.length === 0) {
    log('新着メールなし');
    state.lastChecked = new Date().toISOString();
    saveState(state);
    return;
  }

  log(`新着メール: ${mails.length}件`);

  // 2. Slackに新着メール一覧を投稿
  await postNewMails(mails);
  log('Slack投稿完了');

  // 3. Teams会議メールをGoogleカレンダーに登録
  const teamsMails = mails.filter(m => m.isTeamsMeeting);
  for (const mail of teamsMails) {
    const event = parseTeamsMeeting(mail);
    if (!event) {
      log(`Teams会議パース失敗: ${mail.subject}`);
      continue;
    }

    try {
      const eventId = await registerToCalendar(event);
      log(`カレンダー登録: ${event.title} (${eventId})`);
      await postCalendarRegistration(event);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      log(`カレンダー登録エラー: ${error.message}`);
    }
  }

  // 4. 状態更新
  const maxUid = Math.max(...mails.map(m => m.uid));
  state.lastUid = maxUid;
  state.lastChecked = new Date().toISOString();
  saveState(state);

  log(`完了 (lastUid: ${maxUid})`);
}

main().catch(err => {
  log(`致命的エラー: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
