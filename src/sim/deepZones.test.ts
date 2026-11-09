import { describe, expect, it } from 'vitest';
import { FISH_PRICE, REST_PAY_MAX, SPECIES, ZONES, ZONE_IDS } from './config';
import { dispatchBoat, stepBoats } from './boats';
import { restaurantPrice } from './buildings';
import { reachableZones } from './fleet';
import { Rng } from './rng';
import { loadGame } from './save';
import { initialState } from './state';

const avg = (z: (typeof ZONE_IDS)[number]): number => {
  const t = ZONES[z].table as Record<string, number>;
  const total = Object.values(t).reduce((a, b) => a + b, 0);
  return Object.entries(t).reduce((a, [sp, w]) => a + FISH_PRICE[sp as keyof typeof FISH_PRICE] * w, 0) / total;
};

describe('the deeper places', () => {
  it('each new place pays about 1.35 times the one before, per crate', () => {
    for (let i = ZONE_IDS.indexOf('north'); i < ZONE_IDS.length; i++) {
      const step = avg(ZONE_IDS[i]) / avg(ZONE_IDS[i - 1]);
      expect(step).toBeGreaterThan(1.25);
      expect(step).toBeLessThan(1.45);
    }
  });

  it('take longer and cost more the deeper they are', () => {
    for (let i = 1; i < ZONE_IDS.length; i++) {
      expect(ZONES[ZONE_IDS[i]].trip).toBeGreaterThan(ZONES[ZONE_IDS[i - 1]].trip);
      expect(ZONES[ZONE_IDS[i]].needsHull).toBeGreaterThanOrEqual(ZONES[ZONE_IDS[i - 1]].needsHull);
    }
  });

  it('need the right ship: the Big Trawler opens the Cold North Sea, the Royal Ship The Trench', () => {
    const b = initialState().boats[0];
    b.hull = 3;
    expect(reachableZones(b)).not.toContain('north');
    b.hull = 4;
    expect(reachableZones(b)).toContain('north');
    expect(reachableZones(b)).not.toContain('dark');
    b.hull = 9;
    expect(reachableZones(b)).toContain('trench');
  });

  it('the King Fish can be caught deeper than the Deep Sea too', () => {
    let found = false;
    for (let seed = 1; seed < 400 && !found; seed++) {
      const s = initialState();
      s.money = 1e6;
      s.buildings.lighthouse = 1;
      s.dayTime = 250; // night
      s.lastPhase = 'night';
      s.boats[0].hull = 9;
      s.boats[0].gear = 4;
      dispatchBoat(s, 1, 'trench');
      s.boats[0].nightTrip = true;
      stepBoats(s, 999, new Rng(seed));
      found = s.king.found;
    }
    expect(found).toBe(true);
  });

  it('the restaurant pays at most REST_PAY_MAX for one fish', () => {
    const s = initialState();
    s.buildings.restaurant = 3;
    s.restaurantUp.kitchen = 5;
    const c = { id: 1, species: 'seaserpent' as const, freshness: 100, loc: 'hand' as const };
    expect(restaurantPrice(s, c)).toBe(REST_PAY_MAX);
  });

  it('an older save loads with the new fish not caught yet', () => {
    const old = JSON.parse(JSON.stringify(initialState()));
    old.version = 10;
    for (const sp of ['halibut', 'seaserpent']) { delete old.book[sp]; delete old.demand[sp]; }
    delete old.bookClaims.trench;
    const mem = new Map<string, string>([['harbour-game-save', JSON.stringify(old)]]);
    const l = loadGame({ getItem: (k) => mem.get(k) ?? null, setItem: () => {}, removeItem: () => {} }, new Rng(1))!;
    expect(l.version).toBe(11);
    expect(SPECIES.every((sp) => l.book[sp] && l.demand[sp] === 1)).toBe(true);
    expect(l.book.seaserpent.caught).toBe(0);
    expect(l.bookClaims.trench).toEqual({ caught: false, stars: false });
  });
});
