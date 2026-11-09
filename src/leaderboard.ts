// The game's side of the online leaderboard: the player's name and a random id kept in this browser (apart from the
// game save), fetching the board, and sending the harbour's total earnings now and then. Joining is the player's choice;
// nothing is sent before they pick a name. The server is api/leaderboard.ts; the rules are in sim/board.ts.
import { checkPlayerName } from './sim/board';
import type { BoardRow } from './sim/board';

const KEY = 'harbour-player';
const URL_BOARD = './api/leaderboard';
/** Send the score at most this often while playing (and only when it went up). */
const SEND_EVERY_MS = 10 * 60 * 1000;

export interface Profile { id: string; name: string }
export interface BoardView { status: 'idle' | 'loading' | 'ok' | 'error'; rows: BoardRow[]; me: BoardRow | null; total: number }

function newId(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => (b % 36).toString(36)).join('') + Date.now().toString(36);
}

function loadProfile(): Profile | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Profile | null;
    return p && typeof p.id === 'string' && typeof p.name === 'string' ? p : null;
  } catch {
    return null;
  }
}

export class Leaderboard {
  profile: Profile | null = loadProfile();
  view: BoardView = { status: 'idle', rows: [], me: null, total: 0 };
  private sentEarned = -1;
  private sentAt = 0;
  /** Called when the view changes, so an open window can redraw. */
  onChange: () => void = () => {};

  get joined(): boolean { return this.profile !== null; }

  /** Join (or change name). Returns the problem in plain words, or null. */
  join(raw: string, earned: number, played: number): string | null {
    const c = checkPlayerName(raw);
    if (!c.ok) return c.problem ?? 'chars';
    this.profile = { id: this.profile?.id ?? newId(), name: c.name! };
    try { localStorage.setItem(KEY, JSON.stringify(this.profile)); } catch { /* private mode: lasts this visit */ }
    this.sentAt = 0;
    void this.send(earned, played, true);
    return null;
  }

  /** Fetch the board (and where this player stands). */
  async refresh(): Promise<void> {
    this.set({ ...this.view, status: 'loading' });
    try {
      const r = await fetch(`${URL_BOARD}${this.profile ? `?id=${encodeURIComponent(this.profile.id)}` : ''}`);
      if (!r.ok) throw new Error(String(r.status));
      const d = await r.json() as { rows: BoardRow[]; me: BoardRow | null; total: number };
      this.set({ status: 'ok', rows: d.rows ?? [], me: d.me ?? null, total: d.total ?? 0 });
    } catch {
      this.set({ ...this.view, status: 'error' });
    }
  }

  /** Called every frame: send the score now and then while playing, only when it went up. */
  tick(earned: number, played: number, nowMs: number): void {
    if (!this.profile || nowMs - this.sentAt < SEND_EVERY_MS || earned <= this.sentEarned) return;
    void this.send(earned, played, false);
  }

  private async send(earned: number, played: number, show: boolean): Promise<void> {
    if (!this.profile) return;
    this.sentAt = performance.now();
    this.sentEarned = Math.floor(earned);
    try {
      const r = await fetch(URL_BOARD, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: this.profile.id, name: this.profile.name, earned: Math.floor(earned), played: Math.floor(played) }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const d = await r.json() as { rows: BoardRow[]; me: BoardRow | null; total: number };
      if (show || this.view.status === 'ok') this.set({ status: 'ok', rows: d.rows ?? [], me: d.me ?? null, total: d.total ?? 0 });
    } catch {
      if (show) this.set({ ...this.view, status: 'error' });
    }
  }

  private set(v: BoardView): void {
    this.view = v;
    this.onChange();
  }
}
