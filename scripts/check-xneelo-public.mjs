// Preflight for the public xneelo artifact. Run AFTER package-xneelo-public.mjs.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

const root = path.resolve('.');
const webroot = path.join(root, 'dist', 'xneelo-public');
const manifestFile = path.join(root, 'dist', 'xneelo-manifest.json');
const exists = relative => fs.existsSync(path.join(webroot, relative));
const read = relative => fs.readFileSync(path.join(webroot, relative), 'utf8');
assert(fs.existsSync(manifestFile), 'Missing release manifest');
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
assert(['staging', 'production'].includes(manifest.mode));
assert(manifest.files > 30, 'Unexpectedly small deployment');
assert(manifest.routes >= 10, 'Expected all public pages in build');
for (const filename of [
  'index.html', '404.html', 'release.json', 'favicon.ico',
  '.htaccess', 'robots.txt', 'contact/index.html', 'our-studio/index.html',
  'our-work/index.html', 'privacy-policy/index.html',
  'terms-and-conditions/index.html',
]) assert(exists(filename), 'Missing required public file: ' + filename);
assert(fs.readdirSync(path.join(webroot, '_next', 'static')).length > 0,
  'Missing Next.js CSS and JavaScript');
for (const pathName of [
  'studio', 'studio/index.html', 'studio-preview', 'studio-preview/index.html',
  'local-studio-backup.html', 'protected-site', 'gate-assets',
  'api', 'api/showset/index.php', 'index.php',
]) assert(!exists(pathName), 'Private or preview-only path must not be public: ' + pathName);
const apache = read('.htaccess');
assert(apache.includes('DirectoryIndex index.html'), 'Missing directory routing');
assert(apache.includes('RewriteRule ^work/behind-every-moment/?$ /work/provault/'),
  'The legacy Vercel redirect must also work on Apache');
assert(!apache.includes('RewriteRule ^(.*)$ index.php'), 'PHP preview gate leaked into public export');
assert(read('index.html').includes('showset'), 'Homepage appears empty');
const release = JSON.parse(read('release.json'));
assert(/^[a-f0-9]{40}$/i.test(release.commit), 'Invalid release commit marker');
assert(release.commit === manifest.commit, 'Release marker and manifest do not match');
if (manifest.mode === 'staging') {
  assert(read('robots.txt').includes('Disallow: /'), 'Staging must block crawlers');
  assert(!exists('sitemap.xml'), 'Staging should not expose the production sitemap');
  assert(apache.includes('X-Robots-Tag "noindex'), 'Staging must send noindex header');
} else {
  assert(read('robots.txt').includes('Sitemap: ' + manifest.origin + '/sitemap.xml'),
    'Missing correct public robots sitemap');
  assert(read('sitemap.xml').includes(manifest.origin + '/our-work/'), 'Missing work listing');
  assert(!apache.includes('X-Robots-Tag "noindex'), 'Production must not be noindexed');
}
console.log('xneelo ' + manifest.mode + ' preflight passed: ' +
  manifest.routes + ' routes, ' + manifest.files + ' files, ' + release.commit);
