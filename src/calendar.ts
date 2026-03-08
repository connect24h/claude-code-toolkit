import { google } from 'googleapis';
import { CONFIG } from './config.js';
import type { TeamsEvent } from './types.js';

function getAuthClient() {
  const oauth2Client = new google.auth.OAuth2(
    CONFIG.googleClientId(),
    CONFIG.googleClientSecret()
  );
  oauth2Client.setCredentials({
    refresh_token: CONFIG.googleRefreshToken(),
  });
  return oauth2Client;
}

export async function registerToCalendar(event: TeamsEvent): Promise<string> {
  const auth = getAuthClient();
  const calendar = google.calendar({ version: 'v3', auth });

  const description = [
    event.description ?? '',
    event.joinUrl ? `\nTeams参加リンク: ${event.joinUrl}` : '',
    `\n主催者: ${event.organizer}`,
  ].join('');

  const calendarEvent = {
    summary: event.title,
    description: description.trim(),
    location: event.joinUrl ?? event.location,
    start: {
      dateTime: ensureTimezone(event.startTime),
      timeZone: 'Asia/Tokyo',
    },
    end: {
      dateTime: ensureTimezone(event.endTime),
      timeZone: 'Asia/Tokyo',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  const result = await calendar.events.insert({
    calendarId: CONFIG.googleCalendarId(),
    requestBody: calendarEvent,
  });

  return result.data.id ?? '';
}

/**
 * 日時文字列にタイムゾーンオフセットを追加（なければ JST +09:00）
 */
function ensureTimezone(dateTime: string): string {
  if (dateTime.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateTime)) {
    return dateTime;
  }
  return `${dateTime}+09:00`;
}
