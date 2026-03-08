import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadState, saveState } from './state.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

vi.mock('fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock('./config.js', () => ({
  CONFIG: {
    stateFile: '/tmp/test-state.json',
  },
}));

describe('state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadState', () => {
    it('should load state from file', () => {
      vi.mocked(readFileSync).mockReturnValue(
        JSON.stringify({ lastUid: 42, lastChecked: '2026-03-08T00:00:00Z' })
      );

      const state = loadState();
      expect(state.lastUid).toBe(42);
      expect(state.lastChecked).toBe('2026-03-08T00:00:00Z');
    });

    it('should return default state on error', () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('file not found');
      });

      const state = loadState();
      expect(state.lastUid).toBe(0);
    });
  });

  describe('saveState', () => {
    it('should create directory if not exists', () => {
      vi.mocked(existsSync).mockReturnValue(false);

      saveState({ lastUid: 10, lastChecked: '2026-03-08T00:00:00Z' });

      expect(mkdirSync).toHaveBeenCalledWith(expect.any(String), { recursive: true });
      expect(writeFileSync).toHaveBeenCalled();
    });

    it('should write state as JSON', () => {
      vi.mocked(existsSync).mockReturnValue(true);

      const state = { lastUid: 10, lastChecked: '2026-03-08T00:00:00Z' };
      saveState(state);

      expect(writeFileSync).toHaveBeenCalledWith(
        '/tmp/test-state.json',
        JSON.stringify(state, null, 2),
        'utf-8'
      );
    });
  });
});
