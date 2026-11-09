import { describe, expect, it } from 'vitest';
import { BOARD_KEEP, addScore, checkSubmission, emptyBoard, topRows } from './board';
import { checkName } from './names';
import { isRudeName } from './rude';

describe('rude names', () => {
  it('blocks slurs and swearing, even hidden with spaces, marks, repeats or digits', () => {
    for (const n of ['nigger', 'NIGGA', 'n i g g e r', 'n1gg3r', 'niiiigger', 'big nigger boat', 'Faggot', 'f u c k', 'fuuuck', 'sh1t harbour', 'cunt', 'Fag', 'dick', 'Nazi', 'c0ck']) {
      expect(isRudeName(n), n).toBe(true);
    }
  });
  it('lets ordinary names through, including ones that hide a short word inside', () => {
    for (const n of ['Little Harbour', 'Swanky Bay', 'Hancock', 'Essex Boats', 'Dickens', 'Niger River', 'Scott', 'Peacock', 'Raccoon Cove', 'Grape Harbour', 'Nazir']) {
      expect(isRudeName(n), n).toBe(false);
    }
  });
  it('applies to every name the player types', () => {
    expect(checkName('fuck')).toMatchObject({ ok: false, problem: 'rude' });
    expect(checkName('Sunny Bay')).toMatchObject({ ok: true, name: 'Sunny Bay' });
  });
});

describe('leaderboard scores', () => {
  const id = 'abcdefghij0123456789';
  it('checks that a score is believable', () => {
    expect(checkSubmission({ id, name: 'Sunny Bay', earned: 5000, played: 600 })).toBeNull();
    expect(checkSubmission({ id: 'x', name: 'Sunny Bay', earned: 1, played: 1 })).toBe('bad id');
    expect(checkSubmission({ id, name: 'shit', earned: 1, played: 1 })).toBe('bad name');
    expect(checkSubmission({ id, name: 'Sunny Bay', earned: -5, played: 1 })).toBe('bad score');
    expect(checkSubmission({ id, name: 'Sunny Bay', earned: 1e12, played: 60 })).toBe('too high');
  });

  it('keeps the newest score, ignores one sent too soon, and ranks richest first', () => {
    let f = emptyBoard();
    f = addScore(f, { id, name: 'Sunny Bay', earned: 100, played: 60 }, 1_000_000).file;
    expect(addScore(f, { id, name: 'Sunny Bay', earned: 200, played: 60 }, 1_010_000).changed).toBe(false);
    f = addScore(f, { id, name: 'Sunny Bay', earned: 300, played: 60 }, 1_100_000).file;
    f = addScore(f, { id: 'zzzzzzzzzzzzzzzzzzzz', name: 'Rich Port', earned: 900, played: 60 }, 1_100_000).file;
    const t = topRows(f, id);
    expect(t.rows.map((r) => r.name)).toEqual(['Rich Port', 'Sunny Bay']);
    expect(t.me).toMatchObject({ rank: 2, earned: 300, you: true });
    expect(t.total).toBe(2);
  });

  it('keeps only the top players', () => {
    let f = emptyBoard();
    for (let i = 0; i < BOARD_KEEP + 5; i++) f = addScore(f, { id: `player${String(i).padStart(14, '0')}`, name: `Port ${i}`, earned: i, played: 600 }, 1).file;
    expect(Object.keys(f.players)).toHaveLength(BOARD_KEEP);
    expect(topRows(f).rows[0].earned).toBe(BOARD_KEEP + 4);
  });
});
