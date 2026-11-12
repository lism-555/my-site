/* tools/check-nav.mjs — proves nav.html and the fallback inside nav.js are
 * the same markup, so the two copies can never quietly drift apart.
 *
 *   node tools/check-nav.mjs
 */
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

const navHtml = await readFile(new URL('nav.html', root), 'utf8');
const navJs = await readFile(new URL('nav.js', root), 'utf8');

const match = navJs.match(/const NAV_FALLBACK = `([\s\S]*?)`;/);

if (!match) {
  console.error('FAIL: no NAV_FALLBACK found in nav.js');
  process.exit(1);
}

const normalise = (text) => text.replace(/\r\n/g, '\n').trim();

if (normalise(match[1]) === normalise(navHtml)) {
  console.log('OK  nav.html and the nav.js fallback are identical.');
  process.exit(0);
}

console.error('FAIL: nav.html and the nav.js fallback have drifted apart.');
console.error('      Copy nav.html over the NAV_FALLBACK block in nav.js.');
process.exit(1);
