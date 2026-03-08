import type { MailMessage, TeamsEvent } from './types.js';

/**
 * ICSデータからイベント情報を抽出
 */
function parseIcs(ics: string): Partial<TeamsEvent> {
  const getValue = (key: string): string | undefined => {
    const regex = new RegExp(`^${key}[;:](.*)$`, 'm');
    const match = ics.match(regex);
    return match?.[1]?.trim();
  };

  const getDateValue = (key: string): string | undefined => {
    // DTSTART;TZID=Tokyo Standard Time:20260310T100000 or DTSTART:20260310T100000Z
    const regex = new RegExp(`^${key}[;:].*?(\\d{8}T\\d{6}Z?)`, 'm');
    const match = ics.match(regex);
    if (!match) return undefined;

    const raw = match[1];
    // 20260310T100000Z → ISO format
    const y = raw.slice(0, 4);
    const m = raw.slice(4, 6);
    const d = raw.slice(6, 8);
    const h = raw.slice(9, 11);
    const min = raw.slice(11, 13);
    const sec = raw.slice(13, 15);
    const tz = raw.endsWith('Z') ? 'Z' : '';
    return `${y}-${m}-${d}T${h}:${min}:${sec}${tz}`;
  };

  return {
    title: getValue('SUMMARY'),
    startTime: getDateValue('DTSTART'),
    endTime: getDateValue('DTEND'),
    organizer: getValue('ORGANIZER'),
    location: getValue('LOCATION'),
    description: getValue('DESCRIPTION')?.slice(0, 500),
  };
}

/**
 * メール本文からTeams会議情報を抽出
 */
function parseFromBody(body: string): Partial<TeamsEvent> {
  const joinUrlMatch = body.match(/https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s<"]+/);

  // 日時パターン: 2026年3月10日 10:00-11:00
  const datePatternJa = body.match(/(\d{4})年(\d{1,2})月(\d{1,2})日[^\d]*(\d{1,2}):(\d{2})\s*[-–~～]\s*(\d{1,2}):(\d{2})/);

  let startTime: string | undefined;
  let endTime: string | undefined;

  if (datePatternJa) {
    const [, y, mo, d, sh, sm, eh, em] = datePatternJa;
    startTime = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T${sh.padStart(2, '0')}:${sm}:00`;
    endTime = `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}T${eh.padStart(2, '0')}:${em}:00`;
  }

  return {
    joinUrl: joinUrlMatch?.[0],
    startTime,
    endTime,
  };
}

export function parseTeamsMeeting(mail: MailMessage): TeamsEvent | null {
  let event: Partial<TeamsEvent> = {};

  // ICSがあればそちらを優先
  if (mail.icsData) {
    event = parseIcs(mail.icsData);
  }

  // 本文からも補完
  const bodyData = parseFromBody(mail.body);
  event.title = event.title ?? mail.subject;
  event.startTime = event.startTime ?? bodyData.startTime;
  event.endTime = event.endTime ?? bodyData.endTime;
  event.organizer = event.organizer ?? mail.from;
  event.joinUrl = event.joinUrl ?? bodyData.joinUrl;

  // 最低限 startTime が必要
  if (!event.startTime) {
    return null;
  }

  return {
    title: event.title ?? mail.subject,
    startTime: event.startTime,
    endTime: event.endTime ?? event.startTime,
    organizer: event.organizer ?? mail.from,
    joinUrl: event.joinUrl,
    location: event.location,
    description: event.description,
  };
}
