export interface MailMessage {
  uid: number;
  from: string;
  subject: string;
  date: Date;
  body: string;
  isTeamsMeeting: boolean;
  icsData?: string;
}

export interface TeamsEvent {
  title: string;
  startTime: string;
  endTime: string;
  organizer: string;
  joinUrl?: string;
  location?: string;
  description?: string;
}

export interface MailState {
  lastUid: number;
  lastChecked: string;
}

export interface SlackBlock {
  type: string;
  text?: { type: string; text: string };
  fields?: { type: string; text: string }[];
}
