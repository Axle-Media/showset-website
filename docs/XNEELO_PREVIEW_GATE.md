# SHOWSET xneelo preview gate

This package keeps the Next.js static export behind a PHP session gate on standard PHP hosting. It is a development access gate, not a substitute for a production identity provider.

## Behaviour

- Public visitors see the branded cover page and cannot retrieve exported HTML, JavaScript bundles, content JSON, fonts or media directly.
- Clicking the SHOWSET wordmark or **Step inside** opens the password modal.
- A valid password creates a server-side PHP session. The gateway serves the exported website and routes the Studio API only after that session is verified.
- Direct links are remembered for the sign-in flow, so a valid session opens the requested page.
- Password checks use `password_verify`, session ID regeneration, CSRF validation, same-origin validation, no-store HTML responses and a per-IP attempt limit.
- The preview password hash is configured on the server only. Never put a password or hash into GitHub.

## Configure the password on xneelo

The gate reads `preview_password_hash` from `api/showset/config.local.php`. Generate a hash on a trusted machine with PHP:

```sh
php -r 'echo password_hash("replace-with-a-long-unique-password", PASSWORD_DEFAULT), PHP_EOL;'
```

Copy `backend/api/config.example.php` to `api/showset/config.local.php` on the server, fill in the existing database and Studio settings, and add the generated hash:

```php
'preview_password_hash' => 'PASTE_GENERATED_HASH_HERE',
```

Keep `config.local.php` out of Git. Use a long, unique password and share it only with people who need preview access. The existing Studio login remains a separate authentication step.

## Build the xneelo package

Run:

```sh
npm run package:xneelo
```

The command builds the static export, moves the exported Next.js site into `out/protected-site/`, and places the PHP gate, its public cover assets and the PHP API at the package root. The protected directory has a deny-all `.htaccess` as defence in depth. Do not upload the package to the live domain until the user has explicitly approved deployment.

## Important operational notes

- The gate must be served over HTTPS so the session cookie is marked Secure.
- The host must support PHP sessions, Apache rewrite rules and PHP's `password_verify`, `random_bytes`, `flock` and filesystem access.
- PHP serves protected static files through the gateway, so protected asset requests incur PHP overhead. This is acceptable for a password-protected preview; assess performance before using the same approach as the final public architecture.
- The public cover stylesheet, script, pattern SVG and two self-hosted font files are intentionally public. The website export and API are not directly served without a valid preview session.
- A password gate reduces casual access but is not a guarantee that screenshots, copied content or files obtained by an authorised user cannot be shared.
