// The online leaderboard: one small server function on Vercel (Node.js). GET shows the richest harbours (and where you stand);
// POST sends your harbour's total earnings. Scores live in one private file in Vercel Blob. Two players saving at once
// cannot overwrite each other: a save only goes through if nobody changed the file since it was read, otherwise it retries.
// The rules (names, believable scores, ranking) are shared with the game in src/sim/board.ts.
import { BlobPreconditionFailedError, get, put } from '@vercel/blob';
import { addScore, checkSubmission, emptyBoard, topRows } from '../src/sim/board.js';
import type { BoardFile, Submission } from '../src/sim/board.js';

const PATH = 'leaderboard/board.json';
const json = (body: unknown, status = 200, cache = 'no-store'): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'cache-control': cache } });

async function readBoard(fresh: boolean): Promise<{ file: BoardFile; etag?: string }> {
  const r = await get(PATH, { access: 'private', useCache: !fresh });
  if (!r || r.statusCode !== 200 || !r.stream) return { file: emptyBoard() };
  try {
    const file = JSON.parse(await new Response(r.stream).text()) as BoardFile;
    return { file: file && typeof file.players === 'object' ? file : emptyBoard(), etag: r.blob.etag };
  } catch {
    return { file: emptyBoard(), etag: r.blob.etag };
  }
}

async function show(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get('id') ?? undefined;
  const { file } = await readBoard(false);
  // The CDN keeps this answer for a minute, so many players looking costs only one read a minute.
  return json(topRows(file, id), 200, 'public, max-age=0, s-maxage=60');
}

async function send(request: Request): Promise<Response> {
  const text = await request.text();
  if (text.length > 2000) return json({ error: 'too big' }, 413);
  let s: Partial<Submission>;
  try { s = JSON.parse(text); } catch { return json({ error: 'bad json' }, 400); }
  const problem = checkSubmission(s);
  if (problem) return json({ error: problem }, 400);
  const sub = s as Submission;
  for (let tries = 0; tries < 4; tries++) {
    const { file, etag } = await readBoard(true);
    const r = addScore(file, sub, Date.now());
    if (!r.changed) return json({ ok: true, saved: false, ...topRows(file, sub.id) });
    try {
      await put(PATH, JSON.stringify(r.file), {
        access: 'private', allowOverwrite: true, addRandomSuffix: false, contentType: 'application/json',
        ...(etag ? { ifMatch: etag } : {}),
      });
      return json({ ok: true, saved: true, ...topRows(r.file, sub.id) });
    } catch (e) {
      if (!(e instanceof BlobPreconditionFailedError)) throw e;
      // someone else saved first: read again and retry
    }
  }
  return json({ error: 'busy, try again' }, 503);
}

// A plain Node.js function on Vercel (the Blob library needs Node), answering GET and POST.
export async function GET(request: Request): Promise<Response> {
  try { return await show(request); } catch { return json({ error: 'server' }, 500); }
}

export async function POST(request: Request): Promise<Response> {
  try { return await send(request); } catch { return json({ error: 'server' }, 500); }
}
