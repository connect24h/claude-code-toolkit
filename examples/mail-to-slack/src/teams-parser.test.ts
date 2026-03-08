import { describe, it, expect } from 'vitest';
import { parseTeamsMeeting } from './teams-parser.js';
import type { MailMessage } from './types.js';

function makeMail(overrides: Partial<MailMessage> = {}): MailMessage {
  return {
    uid: 1,
    from: 'test@example.com',
    subject: 'Teams Meeting: 定例会議',
    date: new Date('2026-03-10T10:00:00+09:00'),
    body: '',
    isTeamsMeeting: true,
    ...overrides,
  };
}

describe('parseTeamsMeeting', () => {
  it('should parse ICS data', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'SUMMARY:定例ミーティング',
      'DTSTART;TZID=Tokyo Standard Time:20260310T100000',
      'DTEND;TZID=Tokyo Standard Time:20260310T110000',
      'ORGANIZER:mailto:organizer@example.com',
      'LOCATION:Microsoft Teams Meeting',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');

    const result = parseTeamsMeeting(makeMail({ icsData: ics }));
    expect(result).not.toBeNull();
    expect(result?.title).toBe('定例ミーティング');
    expect(result?.startTime).toBe('2026-03-10T10:00:00');
    expect(result?.endTime).toBe('2026-03-10T11:00:00');
  });

  it('should parse date from body when no ICS', () => {
    const body = '2026年3月10日 14:00-15:30 の会議です。\nhttps://teams.microsoft.com/l/meetup-join/abc123';
    const result = parseTeamsMeeting(makeMail({ body }));
    expect(result).not.toBeNull();
    expect(result?.startTime).toBe('2026-03-10T14:00:00');
    expect(result?.endTime).toBe('2026-03-10T15:30:00');
    expect(result?.joinUrl).toContain('teams.microsoft.com');
  });

  it('should return null when no date is found', () => {
    const result = parseTeamsMeeting(makeMail({ body: 'これは普通のメールです' }));
    expect(result).toBeNull();
  });

  it('should use subject as title when ICS has no SUMMARY', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'DTSTART:20260310T100000Z',
      'DTEND:20260310T110000Z',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');

    const result = parseTeamsMeeting(makeMail({ icsData: ics, subject: 'テスト会議' }));
    expect(result?.title).toBe('テスト会議');
  });

  it('should parse UTC dates from ICS', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'SUMMARY:UTC Meeting',
      'DTSTART:20260315T010000Z',
      'DTEND:20260315T020000Z',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n');

    const result = parseTeamsMeeting(makeMail({ icsData: ics }));
    expect(result?.startTime).toBe('2026-03-15T01:00:00Z');
    expect(result?.endTime).toBe('2026-03-15T02:00:00Z');
  });
});
