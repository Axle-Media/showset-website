// Prepare a public, static-only release for xneelo's Apache web root.
// Never run scripts/copy-export.mjs for this release: that builds the PHP preview gate.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'out');
const destination = path.join(root, 'dist', 'xneelo-public');
const manifestPath = path.join(root, 'dist', 'xneelo-manifest.json');
const mode = process.env.SHOWSET_XNEELO_PACKAGE_MODE || 'staging';
const origin = (process.env.SHOWSET_PUBLIC_ORIGIN || 'https://showset.co.za').replace(/\/+$/, '');
const blockedRoots = new Set([
  'studio', 'studio-preview', 'api', 'protected-site', 'gate-assets',
  'local-studio-backup.html', 'index.php', '.htaccess', 'robots.txt', 'sitemap.xml',
]);
const secretName = /(^|\/)(?:\.env(?:\..*)?|\.git|config\.local\.php|id_rsa.*|id_ed25519.*|known_hosts.*)$/i;
const sensitiveExt = /\.(?:php|sql|sqlite|db|pem|key|p12|pfx)$/i;

function fail(message) { throw new Error('xneelo packaging refused: ' + message); }
if (!['staging', 'production'].includes(mode)) fail('mode must be staging or production');
try {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    fail('SHOWSET_PUBLIC_ORIGIN must be an HTTPS origin without path or credentials');
  }
} catch (error) {
  fail('invalid SHOWSET_PUBLIC_ORIGIN: ' + error.message);
}
if (!fs.existsSync(path.join(source, 'index.html'))) fail('no static export; run npm run build first');
if (fs.existsSync(path.join(source, 'protected-site')) || fs.existsSync(path.join(source, 'index.php'))) {
  fail('out/ contains the legacy password-gated preview package; run a fresh npm run build');
}
const pages = JSON.parse(fs.readFileSync(path.join(root, 'content', 'pages.json'), 'utf8'));
const routes = [...new Set([
  '/', ...Object.values(pages).map(page => page.route),
  '/privacy-policy/', '/terms-and-conditions/',
])].sort();
for (const route of routes) {
  if (!/^\/(?:[a-z0-9-]+\/)*$/.test(route)) fail('invalid public route: ' + route);
  if (!fs.existsSync(path.join(source, route.slice(1), 'index.html'))) fail('missing exported route: ' + route);
}
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.cpSync(source, destination, {
  recursive: true,
  filter(current) {
    const relative = path.relative(source, current).split(path.sep).join('/');
    if (!relative) return true;
    if (fs.lstatSync(current).isSymbolicLink()) fail('symlink in export: ' + relative);
    if (blockedRoots.has(relative.split('/')[0])) return false;
    if (secretName.test(relative) || sensitiveExt.test(relative)) {
      fail('unexpected private or executable file in static export: ' + relative);
    }
    return true;
  },
});

// The public site is static except for this small, tightly scoped PHP
// contact handler. Do not package the unrelated Studio API or preview gate.
const publicApi = path.join(destination, 'api');
fs.mkdirSync(publicApi, { recursive: true });
fs.copyFileSync(
  path.join(root, 'backend', 'contact', 'contact.php'),
  path.join(publicApi, 'contact.php'),
);
fs.writeFileSync(path.join(publicApi, '.htaccess'), [
  'Options -Indexes',
  '<FilesMatch "^(?!contact\\.php$).+">',
  '  Require all denied',
  '</FilesMatch>',
  '',
].join('\n'));

// trailingSlash in next.config.ts emits /route/index.html. No catch-all rewrite.
const apache = [
  '# SHOWSET static website with isolated PHP contact handler (no Studio backend).',
  'Options -Indexes -MultiViews',
  'DirectoryIndex index.html',
  'ErrorDocument 404 /404.html',
  '<IfModule mod_rewrite.c>',
  '  RewriteEngine On',
  '  # Keep the existing Vercel legacy case-study redirect.',
  '  RewriteRule ^work/behind-every-moment/?$ /work/provault/ [R=301,L,NE]',
  '</IfModule>',
  '<IfModule mod_headers.c>',
  '  Header always set X-Content-Type-Options "nosniff"',
  '  Header always set Referrer-Policy "strict-origin-when-cross-origin"',
  '  <FilesMatch "\\.html$">',
  '    Header set Cache-Control "no-cache, must-revalidate"',
  '  </FilesMatch>',
  ...(mode === 'staging' ? ['  Header always set X-Robots-Tag "noindex, nofollow, noarchive"'] : []),
  '</IfModule>',
  '',
].join('\n');
fs.writeFileSync(path.join(destination, '.htaccess'), apache);

const escaped = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map(route => '  <url><loc>' + escaped(origin + route) + '</loc></url>'),
  '</urlset>', '',
].join('\n');
if (mode === 'production') {
  fs.writeFileSync(path.join(destination, 'sitemap.xml'), xml);
  fs.writeFileSync(path.join(destination, 'robots.txt'),
    'User-agent: *\nAllow: /\nSitemap: ' + origin + '/sitemap.xml\n');
} else {
  fs.writeFileSync(path.join(destination, 'robots.txt'),
    'User-agent: *\nDisallow: /\n');
}

function walk(directory, base = directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(item => {
    const absolute = path.join(directory, item.name);
    if (item.isDirectory()) return walk(absolute, base);
    if (!item.isFile()) fail('unsupported export entry: ' + absolute);
    const relative = path.relative(base, absolute).split(path.sep).join('/');
    return [{ relative, size: fs.statSync(absolute).size,
      sha256: crypto.createHash('sha256').update(fs.readFileSync(absolute)).digest('hex') }];
  });
}
// Pin the export's release marker to the exact GitHub source revision.
const buildCommit = process.env.SHOWSET_RELEASE_COMMIT || process.env.GITHUB_SHA || '';
if (/^[a-f0-9]{40}$/i.test(buildCommit)) {
  fs.writeFileSync(path.join(destination, 'release.json'),
    JSON.stringify({ commit: buildCommit.toLowerCase() }) + '\n');
}
const files = walk(destination).sort((a, b) => a.relative.localeCompare(b.relative));
const fingerprint = crypto.createHash('sha256')
  .update(files.map(file => file.relative + ' ' + file.sha256).join('\n'))
  .digest('hex');
const manifest = {
  mode, origin, routes: routes.length, files: files.length,
  bytes: files.reduce((sum, file) => sum + file.size, 0),
  sha256: fingerprint,
  commit: fs.existsSync(path.join(destination, 'release.json'))
    ? JSON.parse(fs.readFileSync(path.join(destination, 'release.json'), 'utf8')).commit
    : 'unknown',
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('xneelo ' + mode + ' public export ready: ' + destination);
console.log(manifest.routes + ' public routes, ' + manifest.files + ' files, ' + manifest.bytes + ' bytes');
console.log('Package fingerprint: ' + manifest.sha256);
console.log('Only public api/contact.php is included; no Studio API, editor backups or secrets.');
console.log('This command does not upload files or change DNS.');
