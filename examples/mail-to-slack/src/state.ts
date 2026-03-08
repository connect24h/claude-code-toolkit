import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { CONFIG } from './config.js';
import type { MailState } from './types.js';

const DEFAULT_STATE: MailState = {
  lastUid: 0,
  lastChecked: new Date().toISOString(),
};

export function loadState(): MailState {
  try {
    const data = readFileSync(CONFIG.stateFile, 'utf-8');
    return JSON.parse(data) as MailState;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveState(state: MailState): void {
  const dir = dirname(CONFIG.stateFile);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2), 'utf-8');
}
