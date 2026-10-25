import fs from 'node:fs';
import path from 'node:path';

const out = path.resolve('out');
if (!fs.existsSync(path.join(out, 'index.html'))) {
  console.error('Run npm run build before packaging.');
  process.exit(1);
}

const protectedSite = path.join(out, 'protected-site');
fs.mkdirSync(protectedSite, { recursive: true });

// Keep every Next.js export file behind the PHP gateway, including HTML,
// JavaScript bundles, content JSON, fonts and project media.
for (const entry of fs.readdirSync(out, { withFileTypes: true })) {
  if (entry.name === 'protected-site') continue;
  fs.renameSync(path.join(out, entry.name), path.join(protectedSite, entry.name));
}
fs.writeFileSync(
  path.join(protectedSite, '.htaccess'),
  'Require all denied\nOptions -Indexes\n',
  'utf8',
);

const api = path.join(out, 'api', 'showset');
fs.mkdirSync(api, { recursive: true });
for (const file of ['index.php', 'config.example.php', '.htaccess']) {
  fs.copyFileSync(path.join('backend', 'api', file), path.join(api, file));
}

fs.copyFileSync(path.join('backend', 'gate', 'index.php'), path.join(out, 'index.php'));
fs.copyFileSync(path.join('backend', 'gate', '.htaccess'), path.join(out, '.htaccess'));

const publicGateAssets = path.join(out, 'gate-assets');
fs.mkdirSync(path.join(publicGateAssets, 'fonts'), { recursive: true });
for (const file of ['gate.css', 'gate.js', 'pattern.svg']) {
  fs.copyFileSync(path.join('backend', 'gate', 'assets', file), path.join(publicGateAssets, file));
}
for (const file of ['showset-0.woff2', 'showset-4.woff2']) {
  const font = path.join(protectedSite, 'fonts', file);
  if (!fs.existsSync(font)) {
    console.error(`Required gate font is missing from the export: ${file}`);
    process.exit(1);
  }
  fs.copyFileSync(font, path.join(publicGateAssets, 'fonts', file));
}

fs.mkdirSync(path.join(protectedSite, 'media', 'uploads'), { recursive: true });
console.log('xneelo package prepared in out/');
console.log('Public entry: PHP password gate. Protected export: out/protected-site/');
console.log('Configure api/showset/config.local.php on the server before enabling preview access.');
console.log('Do not upload to production until the deployment has been explicitly approved.');
