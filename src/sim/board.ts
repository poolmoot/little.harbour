// The online leaderboard's rules: player names (with a rude-word filter), checking a sent score, and keeping the
// leaderboard file in order. Pure and tested; used by the game and by the server function in api/leaderboard.ts.
import { checkName } from './names';
import type { NameCheck } from './names';

/** How many players the leaderboard file keeps, and how many it shows. */
export const BOARD_KEEP = 500;
export const BOARD_SHOW = 50;
/** A player may send a new score at most this often (seconds). */
export const BOARD_MIN_GAP = 60;
/** A simple check against made-up scores: no harbour earns more than this per minute played (away earnings included, generously). */
export const BOARD_MAX_PER_MIN = 1_000_000;

// ---- names ---------------------------------------------------------------------------------------

/** The leaderboard name check: the same rules as every name in the game (which includes the rude-word filter). */
export const checkPlayerName = (raw: string): NameCheck => checkName(raw);

// ---- scores ----------------------------------------------------------------------------------------

export interface BoardEntry { name: string; earned: number; at: number }
export interface BoardFile { players: Record<string, BoardEntry> }
export interface Submission { id: string; name: string; earned: number; played: number }
export interface BoardRow { rank: number; name: string; earned: number; you?: boolean }

export const emptyBoard = (): BoardFile => ({ players: {} });

/** A random player id made of letters and digits (kept in the player's browser; not their name). */
export const ID_PATTERN = /^[a-z0-9]{16,40}$/;

/** Is this a believable score? Returns the problem in plain words, or null. */
export function checkSubmission(s: Partial<Submission>): string | null {
  if (typeof s.id !== 'string' || !ID_PATTERN.test(s.id)) return 'bad id';
  if (typeof s.name !== 'string' || !checkPlayerName(s.name).ok) return 'bad name';
  if (typeof s.earned !== 'number' || !Number.isFinite(s.earned) || s.earned < 0 || s.earned > 1e13) return 'bad score';
  if (typeof s.played !== 'number' || !Number.isFinite(s.played) || s.played < 0) return 'bad time';
  if (s.earned > BOARD_MAX_PER_MIN * (s.played / 60 + 1)) return 'too high';
  return null;
}

/** Put a checked score into the file. Too soon after the last one: nothing changes. Only the top BOARD_KEEP stay. */
export function addScore(file: BoardFile, s: Submission, now: number): { file: BoardFile; changed: boolean } {
  const old = file.players[s.id];
  if (old && now - old.at < BOARD_MIN_GAP * 1000) return { file, changed: false };
  const players = { ...file.players, [s.id]: { name: checkPlayerName(s.name).name!, earned: Math.floor(s.earned), at: now } };
  const ids = Object.keys(players);
  if (ids.length > BOARD_KEEP) {
    ids.sort((a, b) => players[b].earned - players[a].earned);
    for (const id of ids.slice(BOARD_KEEP)) delete players[id];
  }
  return { file: { players }, changed: true };
}

/** The top rows, richest first, and where this player stands (even outside the top rows). */
export function topRows(file: BoardFile, id?: string, show = BOARD_SHOW): { rows: BoardRow[]; me: BoardRow | null; total: number } {
  const all = Object.entries(file.players).sort((a, b) => b[1].earned - a[1].earned || a[1].at - b[1].at);
  const rows = all.slice(0, show).map(([pid, e], i) => ({ rank: i + 1, name: e.name, earned: e.earned, ...(pid === id ? { you: true } : {}) }));
  const at = id ? all.findIndex(([pid]) => pid === id) : -1;
  const me = at >= 0 ? { rank: at + 1, name: all[at][1].name, earned: all[at][1].earned, you: true } : null;
  return { rows, me, total: all.length };
}
