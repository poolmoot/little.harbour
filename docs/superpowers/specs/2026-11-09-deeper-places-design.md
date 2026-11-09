# Deeper places and more fish

Date: 2026-11-09. Builds on `2026-10-28-restaurant-and-big-ships-design.md`.

## Why

The big ships (Boat size 4-9) only brought home more crates; there was nothing new to reach.
Now four deeper places open with them, each with three new fish (24 fish in all).

## The places

Each place pays about 1.35 times the one before per crate (Deep Sea is about $290).

| Place | Needs | Trip (s) | Fish (price, share) | Avg per crate |
|---|---|---|---|---|
| Cold North Sea | Big Trawler (4) | 190 | Halibut $260 50%, King crab $390 35%, Ice fish $820 15% | ~$390 |
| Dark Deep | Flagship (6) | 230 | Lanternfish $355, Gulper eel $530, Oarfish $1,120 | ~$530 |
| Sunken Wreck | Factory Ship (8) | 280 | Ghost shark $480, Coelacanth $720, Pearl oyster $1,500 | ~$715 |
| The Trench | Royal Ship (9) | 340 | Dragonfish $650, Frilled shark $970, Sea serpent $2,050 | ~$970 |

Trip costs (fixed + per crate of hold): 60+75, 100+100, 150+135, 220+180, about 19% of a
crate's worth, like the Deep Sea, so each place costs more than the one before. All four are
storm places. Fish book rewards: all fish caught $1,000 / $2,000 / $3,500 / $6,000; all with
3 stars $3,000 / $6,000 / $10,000 / $18,000.

## Ship prices

With smaller steps per place the newest ships are cheaper, so they still pay back:
Ocean Ship $650,000, Factory Ship $1,200,000, Royal Ship $2,200,000 (others unchanged).

## Other rules

- The King Fish can be caught at night in the Deep Sea or any deeper place; each place deeper
  adds 35% to the chance (trips there are longer). Base chance back to 2.5%.
- The restaurant pays at most $5,000 for one fish (`REST_PAY_MAX`), so rare deep fish go to the market.
- Save version 11; older saves load with the new fish not caught yet.

Pacing (8 seeds, medians): ranks at 2.5, 10.0, 27.6 and 51.0 minutes; King Fish at the inn
about 108 minutes (it is luck: some runs need more nights).
