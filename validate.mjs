// Submission-readiness check for every built page.
// Run after `node build.mjs`:  `node validate.mjs`  (exits non-zero on any failure)
// Checks per page: unique <title> < 60 chars, unique meta description < 160,
// exactly one <h1>, a canonical tag, a self-referencing hreflang, parseable JSON-LD.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const dataDir = join(ROOT, 'data');
const load = d => readdirSync(d).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(join(d, f), 'utf8')));

const markets = load(dataDir);
const keywords = existsSync(join(dataDir, 'keywords')) ? load(join(dataDir, 'keywords')) : [];
const legals = existsSync(join(dataDir, 'legal')) ? load(join(dataDir, 'legal')) : [];

const pages = [
  'index.html',
  ...markets.map(m => `${m.cc}/index.html`),
  ...keywords.map(k => `${k.cc}/${k.slug}/index.html`),
  ...legals.map(l => `${l.slug}/index.html`),
  'thanks/index.html', // noindex conversion page (not in sitemap, but still must be submission-ready)
];

const titles = new Map(), metas = new Map();
const fails = [];
console.log('page'.padEnd(34), 'T   M    h1 canon hl self  ld');
for (const p of pages) {
  const h = readFileSync(join(ROOT, p), 'utf8');
  const title = (h.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
  const meta = (h.match(/<meta name="description" content="([\s\S]*?)">/) || [])[1] || '';
  const h1 = (h.match(/<h1[\s>]/g) || []).length;
  const canonical = /rel="canonical"/.test(h);
  const lang = (h.match(/<html lang="([^"]+)"/) || [])[1] || '';
  const hreflangs = [...h.matchAll(/hreflang="([^"]+)"/g)].map(m => m[1]);
  const ld = [...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  let ldOK = true; ld.forEach(x => { try { JSON.parse(x[1]); } catch { ldOK = false; } });
  const selfRef = hreflangs.some(x => x === lang || (x === 'en-IE' && lang === 'en'));

  if (title.length > 60) fails.push(`${p}: title ${title.length}>60`);
  if (title.length === 0) fails.push(`${p}: title missing`);
  if (meta.length > 160) fails.push(`${p}: meta ${meta.length}>160`);
  if (meta.length === 0) fails.push(`${p}: meta missing`);
  if (h1 !== 1) fails.push(`${p}: h1 count ${h1}`);
  if (!canonical) fails.push(`${p}: no canonical`);
  if (!selfRef) fails.push(`${p}: hreflang missing self-reference`);
  if (!ldOK) fails.push(`${p}: JSON-LD invalid`);
  if (titles.has(title)) fails.push(`${p}: duplicate title with ${titles.get(title)}`); else titles.set(title, p);
  if (metas.has(meta)) fails.push(`${p}: duplicate meta with ${metas.get(meta)}`); else metas.set(meta, p);

  console.log(p.padEnd(34), `${title.length}`.padEnd(3), `${meta.length}`.padEnd(4), `${h1}  ${canonical ? 'Y' : 'N'}     ${hreflangs.length}  ${selfRef ? 'Y' : 'N'}     ${ld.length}/${ldOK ? 'ok' : 'BAD'}`);
}

console.log(`\n${fails.length ? 'FAILURES (' + fails.length + '):' : 'PASS — all pages submission-ready.'}`);
fails.forEach(f => console.log(' •', f));
process.exit(fails.length ? 1 : 0);
