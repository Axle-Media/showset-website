import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const pages = JSON.parse(readFileSync(new URL('../content/pages.json', import.meta.url), 'utf8'));
const routes = new Set();

for (const [key, page] of Object.entries(pages)) {
  assert.equal(page.slug, key, `Page slug mismatch: ${key}`);
  assert.equal(typeof page.route, 'string', `Missing route: ${key}`);
  assert(!routes.has(page.route), `Duplicate route: ${page.route}`);
  routes.add(page.route);
  const title = page.seo?.title?.trim() || '';
  const description = page.seo?.description?.trim() || '';
  assert(title.length >= 4, `Missing SEO title: ${key}`);
  assert(description.length >= 75 && description.length <= 300,
    `SEO description must be 75–300 characters: ${key} (${description.length})`);
  assert(!description.includes('—'), `Unapproved em dash in SEO description: ${key}`);
}
console.log(`Validated SEO metadata and unique routes for ${Object.keys(pages).length} SHOWSET pages.`);
