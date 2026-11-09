// The rude-word filter for every name the player types (harbour, boats, leaderboard). Pure and tested.

/**
 * Words a name may never contain anywhere (slurs and strong swearing), and words it may not have as a whole word
 * (short ones that also hide inside ordinary names, like "Hancock" or "Essex"). Letters may be repeated to sneak past
 * ("fuuuck"), and look-alike digits and marks are read as letters ("n1gg3r"), so both are caught.
 */
const ANYWHERE = [
  'nigger', 'nigga', 'niggah', 'faggot', 'fuck', 'cunt', 'shit', 'bitch', 'whore', 'slut', 'pussy', 'penis', 'vagina',
  'retard', 'tranny', 'wetback', 'hitler', 'asshole', 'bastard', 'jizz', 'porn', 'kkk', 'nazis', 'motherf',
];
const WHOLE_WORD = ['fag', 'fags', 'spic', 'coon', 'gook', 'chink', 'paki', 'dyke', 'cock', 'dick', 'rape', 'sex', 'cum', 'nazi', 'kike', 'homo', 'anal', 'twat', 'wank', 'wanker'];

const LOOKALIKE: Record<string, string> = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '8': 'b', '9': 'g' };

/** "f+u+c+k+": each letter may be repeated. */
const pattern = (w: string): string => [...w].map((ch) => `${ch}+`).join('');
const ANYWHERE_RE = new RegExp(ANYWHERE.map(pattern).join('|'));
const WORD_RE = new RegExp(`^(?:${WHOLE_WORD.map(pattern).join('|')})$`);

/** Lower case, accents off, look-alike digits and marks turned into letters. */
function normalise(raw: string): string {
  return raw.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[0-9!|@$]/g, (c) => LOOKALIKE[c] ?? c);
}

/** True when a name contains a slur or swearing, written plainly or hidden with spaces, marks, repeats or digits. */
export function isRudeName(raw: string): boolean {
  const n = normalise(raw);
  const joined = n.replace(/[^a-z]/g, '');
  if (ANYWHERE_RE.test(joined)) return true;
  if (WORD_RE.test(joined)) return true;
  return n.split(/[^a-z]+/).some((w) => w.length > 0 && WORD_RE.test(w));
}
