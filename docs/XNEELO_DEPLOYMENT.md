# SHOWSET stage deployment on xneelo (no extra monthly server required)

**Do not replace the live `showset.co.za` homepage yet.** The sequence below is for an isolated staging domain or local xneelo subdomain.

1. **Back up WordPress** (files, database and wp-config). Keep the existing site live and do not change Google Workspace MX/TXT records.
2. In xneelo, create a staging subdomain or separate document-root directory such as `stage.showset.co.za` if your hosting package supports multiple domains. Configure HTTPS before entering passwords. If it does not support a separate document root, stage elsewhere instead of placing two apps in the same live root.
3. Build locally with Node.js: `npm install && npm run package:xneelo`. This creates `out/` with static HTML, JS, CSS and `/api/showset/index.php`.
4. Upload **contents** of `out/` to the STAGING document root via FTP or File Manager. Do not overwrite the WordPress document root.
5. In xneelo **Manage MySQL**, create a dedicated database/user with only necessary rights; import `backend/sql/schema.sql` using a MySQL client or phpMyAdmin equivalent.
6. On staging, copy `/api/showset/config.example.php` to `/api/showset/config.local.php`; enter DB host/name/user/password, an admin password HASH, and the verified destination inbox. Do not place secrets in Git, text snippets or chat messages. See the bundled instructions in that file for generating a password hash using PHP CLI.
7. Confirm Apache serves PHP from `/api/showset/index.php?action=session`, and returns `authenticated:false`. Confirm `/api/showset/config.local.php` is blocked by web-server access rules. Verify PHP sessions and uploads have a writable persistent directory.
8. Open `https://stage.showset.co.za/studio/`, log in, edit a draft, save, then publish. Check the public page update on reload. Check media uploads and browser developer tools for errors.
9. Verify the email form against a real verified inbox. Verify spam throttling, form validation and delivery. Do not publish an untested form.
10. Test iPhone and Android browsers, desktop browsers, loading speed, motion accessibility, keyboard navigation and all 11 routes before switch-over.
11. Launch only after approval: migrate WordPress to a separate CMS subdomain if retaining it, or safely retire it; point `showset.co.za` at the new static document root. Avoid changing MX, SPF, DKIM or other Google Workspace email records.

## Publish caveat

Publishing existing content writes published JSON to MySQL, and React fetches it on load. A new page or SEO title change is not present in build-time HTML until the next Next.js static build and FTP deployment. This cannot be fixed with PHP content storage alone without adding server-side rendering logic.

## Updates and backups

Back up both the database AND `media/uploads/`. Maintain revision tables and backups. When uploading a new static build, preserve uploaded media and `config.local.php`. The `copy-export` script deliberately excludes config.local.php from the packaged files.

## Performance and hosting

GSAP is not a required runtime dependency in this starter. The motion in this version uses browser-native scroll progress, transforms and CSS transitions to minimise bundle size. Add GSAP if future choreography justifies it, subject to current licensing and performance review.
