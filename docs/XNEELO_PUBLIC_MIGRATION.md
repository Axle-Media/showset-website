# SHOWSET: public website migration from Vercel to xneelo

**Status: preparation only. No live upload, DNS cutover or publishing backend is authorised by this document.**

## Architecture and hosting

SHOWSET already uses Next.js static export (`output: 'export'`, `trailingSlash: true`, unoptimised images). Its `out/` directory contains static HTML, CSS, JS, images and fonts. Standard xneelo Apache web hosting can serve these from the assigned domain's `public_html/`. Node.js is needed for the build on GitHub, **not** on the xneelo server.

**Use `npm run package:xneelo:public` for the public site, NEVER `npm run package:xneelo`.** The legacy command makes a *different*, password-protected PHP preview gateway (`out/protected-site/`).

The public package excludes `/studio/`, `/studio-preview/`, `/local-studio-backup.html`, the PHP API, all gate files and private configuration. SHOWSET Studio 2.0 needs an independently secured backend before it can publish, potentially on `studio.showset.co.za`. Do not expose the editor on the public site.

## Build an auditable static release

With Node 22 and the repository checked out:

```sh
npm ci
npm run check
npm run lint:source
npm run check:seo
npm run package:xneelo:public
```

The command builds Next.js, creates `dist/xneelo-public/` with the public website and Apache `.htaccess`, and verifies routes/redirects/privacy. `dist/xneelo-manifest.json` records the commit, file count and fingerprint. It **never logs in to xneelo or changes DNS**.

Default `SHOWSET_XNEELO_PACKAGE_MODE=staging` applies a noindex header and `robots.txt: Disallow: /`. It is **not password protection**. Arrange separate password protection if a confidential preview is required.

After sign-off, generate a public-indexable package:

```sh
SHOWSET_XNEELO_PACKAGE_MODE=production SHOWSET_PUBLIC_ORIGIN=https://showset.co.za npm run package:xneelo:public
```

On Windows PowerShell, set `$env:SHOWSET_XNEELO_PACKAGE_MODE='production'` and `$env:SHOWSET_PUBLIC_ORIGIN='https://showset.co.za'` before running the command.

Production includes an Apache redirect from `/work/behind-every-moment/` to `/work/provault/`, `robots.txt`, and `sitemap.xml`. Do **not** upload a staging (noindex) package to the live site.

## GitHub release workflow

In [SHOWSET GitHub Actions](https://github.com/Axle-Media/showset-website/actions), select **Prepare SHOWSET xneelo static package → Run workflow**, choose **staging** for the first test and leave the final domain set to `https://showset.co.za`. Download the resulting `showset-xneelo-static-package` artifact:

- `showset-xneelo-staging.zip` (or `showset-xneelo-production.zip`)
- `xneelo-manifest.json` for expected content and source commit
- `SHA256SUMS.txt` to verify transport integrity

The ZIP contains `index.html` and hidden `.htaccess` **at its root**. Extract its contents directly into the site's assigned document root, not into a nested folder. The GitHub workflow **does not automatically upload, deploy, overwrite or alter DNS**.

## Replacing the existing SHOWSET placeholder in public_html

This account already has a backed-up WordPress installation and a Next.js/PHP
preview occupying the root of `public_html`. **Do not install a fresh hosting
package or create another subdomain for the public launch**.

The new `main` workflow produces a **production** release ZIP as a downloadable
artifact after each approved site change. On the `Prepare SHOWSET xneelo static
package` workflow page, open the latest successful **push / main** run, download
`showset-xneelo-static-package`, then extract the *outer GitHub artifact ZIP*
locally. Upload the **inner `showset-xneelo-production.zip`**, not the
`showset-xneelo-staging.zip` used in pull request checks.

For a clean replacement:

1. Confirm the old WordPress and PHP preview files have a current backup **outside
   the publicly accessible web root**. Do not rely solely on a ZIP in
   `public_html`; move or download any `Back-Up.zip` before cleaning.
2. In xneelo File Manager, open `public_html`. Retain the
   **`public_html` directory itself** and leave sibling email/log data alone.
3. Remove obsolete website files *inside* the directory, including `index.php`,
   old `.htaccess`, `wp-admin`, `wp-content`, `wp-includes`, `api`,
   `protected-site`, `gate-assets`, and preview-related folders/files.
   Do not delete unrecognised application or verification files until their
   ownership is known, and preserve any required `.well-known` records.
4. Upload the inner production ZIP to `public_html` (typically under the xneelo
   File Manager 100 MB upload limit), then use the File Manager's ZIP extraction
   feature. If extraction creates an extra parent folder, **move its contents**
   up into `public_html`. Ensure `.htaccess` is included and overwrites the
   previous PHP-preview routing rules.
5. Confirm `public_html/index.html`, `public_html/_next/static/`,
   `public_html/contact/index.html`, and `public_html/release.json` are at the
   correct depth. There must be **no** old `index.php` or `wp-*` files
   interfering with the new static site.
6. Test the site's current public domain (if already pointed to xneelo) or the
   xneelo interim URL before changing any DNS. The interim URL can be useful
   for inspection, but it may not perfectly reproduce root-relative asset paths
   if it includes a path prefix.
7. Do not remove the Vercel deployment until the new site's pages and
   iPhone/desktop presentation have been verified.

**Never delete the `public_html` directory or symbolic link itself.** A clear
root and one active `.htaccess` prevent the old PHP gate from overriding the
new static site.

## Stage on xneelo without affecting the live site

1. Confirm the existing xneelo hosting plan has **showset.co.za assigned to a web-accessible document root**. DNS records alone do not create an Apache site or `public_html` directory.
2. Identify the server hostname/IP, domain-level document root, FTP/SFTP user, available storage, HTTPS certificate and preview hostname/interim URL in the **xneelo Control Panel**. Do not assume other domains on the account use the same root.
3. Make a backup of the destination (including any existing `.htaccess`). Never overwrite an active WordPress site or an existing PHP app. Use a separate staging domain/root if possible.
4. Upload and extract the **staging** ZIP through xneelo File Manager or SFTP. Confirm `public_html/index.html`, `public_html/.htaccess`, `public_html/_next/static/`, `public_html/contact/index.html` and `public_html/release.json` exist.
5. Test direct refreshes of Home, Our Studio, Our Work, Contact, all four service pages, every case study and both legal pages. Check images, fonts, video/lightbox, menu, carousels, scroll transitions, links and the email form on actual desktop and iPhone Safari.
6. Confirm `/release.json` matches the GitHub manifest; unknown URLs return 404, the old case-study URL redirects 301 and `/studio/` is not present. Check HTTPS, no mixed content, performance, desktop/tablet/mobile overflow and that staging is noindexed.
7. Request explicit go-live approval before uploading the production package or changing DNS.

xneelo documentation: [File Manager / uploading](https://xneelo.co.za/help-centre/website/upload-download-website/), [SFTP changes in October 2026](https://xneelo.co.za/help-centre/website/changes-to-your-ftp-access/), [SSH keys and automation](https://xneelo.co.za/help-centre/website/how-to-set-up-and-use-ssh-keys-for-ssh-sftp-access/). xneelo describes manual SFTP on **port 22** and automated key-based SSH on **port 2222**. Use the connection details and host key obtained from your actual hosting plan. Never commit or share private keys, FTP passwords, API secrets or database credentials.

## Approved cutover and rollback

- Upload a **fresh production** ZIP to the approved document root after backing up existing files. Confirm `index.html`, `.htaccess`, the certificate and `release.json` before DNS cutover.
- Change **only website-facing A/AAAA/CNAME records** in the authoritative DNS. Preserve Google Workspace MX, SPF, DKIM, DMARC and verification TXT records. **Do not switch nameservers or email records** just to move the web host.
- Ensure `showset.co.za` and the desired `www` hostname work over HTTPS; agree on the www/apex redirect. Verify redirects, SEO, analytics, Contact behaviour and all key pages from an external network.
- Keep Vercel running until xneelo is tested and accepted. For rollback, restore the backed-up files or former web DNS records. DNS caches can delay rollback.
- Only later, after a separately approved hosting/auth design, connect SHOWSET Studio 2.0 to its own publishing backend and deployment/rollback workflow.

## Important limitations

The current contact flow prepares an email for the visitor to review and send. Static hosting alone **does not deliver enquiries**; adding a real email delivery backend is a separate task. New or edited case studies require a fresh static export before they appear on public URLs. Static export provides no Next.js server actions, PHP Studio publishing, automatic database updates or image optimisation. The existing Vercel config does not execute on Apache; known redirects are explicitly mirrored in `.htaccess`. Confirm SEO canonical domain, search console verification and analytics during final cutover.

A future automated GitHub→xneelo upload should be a **separate reviewed workflow** after SSH access is confirmed, with environment approvals, pinned SSH host keys, scoped credentials, staging-first verification, remote backups and no destructive mirror deletion by default. For now GitHub deliberately generates artifacts only.
