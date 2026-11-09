# Online leaderboard

Date: 2026-11-09.

## What it is

An opt-in, online list of the richest harbours, ranked by total money earned (`state.lifetime`).
Opened from **Leaderboard** on the title screen and in the pause menu. The first time, the player
picks a name and presses Join; after that the page shows the top 50, the player's own place, and a
field to change the name.

## Names

Every name the player types (leaderboard, harbour, boats) goes through `checkName`, which now also
refuses rude names (`sim/rude.ts`): slurs and strong swearing anywhere in the name, and short ones
as whole words, also when hidden with spaces, marks, repeated letters or look-alike digits.

## How scores travel

- The browser keeps `{ id, name }` under its own `localStorage` key `harbour-player` (not in the save).
  The id is random; nothing is sent before the player joins.
- `src/leaderboard.ts` sends `{ id, name, earned, played }` on joining and then at most every
  10 minutes while playing, only when earnings went up.
- `api/leaderboard.ts` (a Vercel edge function) checks it (`checkSubmission`: id shape, name, a score
  no higher than $1,000,000 per minute played), ignores sends under 60 s apart per player, and saves
  it into one private Vercel Blob file (`leaderboard/board.json`, store `little-harbour-leaderboard`).
  A save only goes through if nobody changed the file since it was read (ETag), else it retries.
  The best 500 players are kept. GET answers are cached by the CDN for a minute.
- Rules live in `src/sim/board.ts` (pure, tested) and are shared by the game and the server.

## Limits

Scores come from the player's browser, so a determined cheat can still send a believable fake.
Bad entries can be removed by editing the file in the Vercel dashboard (Storage). If the game grows
past what the free Blob plan allows, move the file to a database such as Upstash Redis.
