import { button, empty, esc, money, section, textField } from '../components';
import { icon } from '../icons';
import { BOARD_TEXT as T, MENU } from '../menuText';
import type { BoardRow } from '../../sim/board';
import type { Screen } from './types';

const row = (r: BoardRow): string =>
  `<div class="lb-row${r.you ? ' you' : ''}"><span class="lb-rank ol">${r.rank}</span><span class="lb-name">${esc(r.name)}${r.you ? ` <span class="lb-you ol">${T.you}</span>` : ''}</span><span class="lb-money ol">${icon('coin', 18)}${money(r.earned)}</span></div>`;

/** The online leaderboard: first a name to join with, then the richest harbours by money earned. */
export const leaderboardScreen: Screen = (ctx) => {
  const b = ctx.board;
  const back = `${button({ label: MENU.back, act: 'menuback', tone: 'info', size: 'sm' })}<span class="dim">Esc</span>`;
  if (!b || !b.joined) {
    return {
      title: T.joinTitle,
      icon: icon('star', 28),
      menu: true,
      body: `<p class="lb-line">${T.joinLine}</p>${textField({ id: 'playername', value: '', label: T.nameLabel, save: 'joinboard', saveLabel: T.join })}`,
      note: T.shared,
      foot: back,
    };
  }
  const v = b.view;
  let list: string;
  if (v.status === 'error') list = empty(T.error);
  else if (v.status !== 'ok' && !v.rows.length) list = empty(T.loading);
  else if (!v.rows.length) list = empty(T.empty);
  else list = `<div class="lb-list">${v.rows.map(row).join('')}</div>`;
  const inTop = v.rows.some((r) => r.you);
  const mine = v.me ? (inTop ? '' : row(v.me)) + `<p class="lb-line">${T.yourPlace(v.me.rank, v.total)}</p>` : v.status === 'ok' ? `<p class="lb-line dim">${T.notYet}</p>` : '';
  return {
    title: T.title,
    icon: icon('star', 28),
    menu: true,
    body: section(`${T.richest} · ${T.earned}`) + list + mine
      + section(T.changeName) + textField({ id: 'playername', value: b.name, label: T.nameLabel, save: 'joinboard', saveLabel: T.save }),
    note: T.shared,
    foot: `${back}${button({ label: T.refresh, act: 'boardrefresh', tone: 'info', size: 'sm' })}`,
  };
};
