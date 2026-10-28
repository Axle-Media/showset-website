# SHOWSET contact email delivery on xneelo

This package implements the same architecture as Axle Media's HTML-to-PHP form, with authenticated SMTP rather than a basic PHP mail call. No WordPress, database, third-party form subscription, or direct public SMTP credentials are required.

**Receiver:** `hello@showset.co.za` via SMTP from an authorized SHOWSET Google Workspace account.

## Files in this package

```text
deploy/xneelo-contact/
├── public_html/
│   └── api/
│       ├── showset-contact.php
│       ├── .htaccess
│       └── phpmailer/          (PHPMailer 7.1.1, licensed LGPL 2.1)
│           ├── .htaccess
│           ├── LICENSE
│           └── src/
│               ├── PHPMailer.php
│               ├── Exception.php
│               └── SMTP.php
└── showset-private/
    ├── .htaccess
    └── contact-config.example.php
```

## 1. Prepare the xneelo hosting

Use the xneelo file manager for the existing **showset.co.za hosting product**. Check the actual document root, typically `public_html`. The PHP endpoint is intended to coexist with the temporary site and to remain available after SHOWSET moves from Vercel to xneelo.

Copy the contents of this package's `public_html` directory **into the hosting account's actual public document root**. The live endpoint will be:

```
https://showset.co.za/api/showset-contact.php
```

Copy the **entire** `showset-private` directory to the **parent of the document root**; never put live SMTP credentials inside `public_html`. The required layout on xneelo is:

```text
your-hosting-account/
├── public_html/
│   └── api/showset-contact.php
│   └── api/phpmailer/src/...
└── showset-private/
    ├── .htaccess
    ├── contact-config.php
    └── rate/  (created automatically)
```

Rename `showset-private/contact-config.example.php` to `contact-config.php` on the server. The example file is safe to keep locally but must not be referenced by the live PHP handler. If your xneelo folder layout differs, update the endpoint's configuration-path lookup or ask for help before publishing.

**Do not change the MX records, DKIM, or existing Google Workspace email configuration.** This is an outbound authenticated SMTP connection, not a migration of the SHOWSET mailbox.

## 2. Configure authenticated Google Workspace SMTP

Use an authorized SHOWSET sending account, preferably `hello@showset.co.za` if it is a real Workspace mailbox.

In `showset-private/contact-config.php` edit:

- `smtp.host`: `smtp.gmail.com`
- `smtp.port`: `587` (STARTTLS)
- `smtp.username`: the complete Google Workspace login address
- `smtp.password`: a Google Workspace **app password**, **not your usual account password**
- `sender`: the authenticated mailbox address, or an authorized send-as alias
- `recipient`: `hello@showset.co.za`
- `rate_key`: independently generated random 64-character hex string
- `allowed_origins`: exact Vercel and SHOWSET public origins; no wildcard
- `rate_dir`: leave as `__DIR__ . '/rate'` (outside document root)

Generate `rate_key` privately using PHP command line (`php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"`), or a reputable local random-secret generator. Do not post the app password or rate key in a chat, commit, or publicly accessible file. Limit permissions on `contact-config.php` to the hosting account where supported.

Google Workspace SMTP via `smtp.gmail.com` requires 2-Step Verification and an app password if the admin/account permits it. If app passwords are blocked, use a correctly configured Workspace SMTP relay or other authenticated sender with verified identity; this endpoint supports a standard STARTTLS SMTP relay by changing host, username and password. SMTP relay arrangements can depend on a static IP and Google Workspace admin settings.

PHPMailer is included in the package under its original license. It is pinned to **7.1.1**; refresh this vendor copy when security releases appear.

## 3. Confirm PHP is deployed without sending mail

After uploading, visit:

```
https://showset.co.za/api/showset-contact.php
```

A GET request with no `Origin` should return an HTTP **403 JSON response**; this is expected and proves the PHP script is executing, not that SMTP works. If it returns the WordPress homepage or a 404, check the actual document root and rewrite rules. If it returns PHP source code or a download prompt, stop immediately: PHP is not executing.

From the CI runner, `qa/contact-php-smoke.sh` checks PHP syntax and that preflight, origin restrictions, field validation, spam honeypot and throttling fail safely. It does not send any email.

## 4. Connect the Vercel frontend only after PHP is working

The Contact page currently retains an honest email-draft fallback. The PHP API must be uploaded, configured and verified before activating direct sending.

In the **SHOWSET Vercel project** add this **build-time** environment variable:

```text
NEXT_PUBLIC_SHOWSET_CONTACT_ENDPOINT=https://showset.co.za/api/showset-contact.php
```

Redeploy the website (the Next.js static export embeds this setting during the build).

The existing client will then use `fetch` with JSON, and show a success state **only** if the endpoint responds with `{"ok":true,"code":"accepted_by_smtp"}`. A generic HTTP 200/204, HTML error page, CORS error or SMTP failure is not counted as success. Credentials stay exclusively on xneelo.

When SHOWSET itself is eventually served from xneelo, the same endpoint can be accessed as `/api/showset-contact.php` via the equivalent build-time setting; do not accidentally drop the PHP files when replacing the public website.

## 5. End-to-end acceptance before activating

Perform one genuine submission from the Vercel Contact page with a distinct test name, project type, and message. Confirm:

1. The browser sends one POST to the xneelo endpoint and receives the exact success JSON.
2. An email **actually arrives** in the `hello@showset.co.za` Google Workspace inbox, with every supplied field.
3. Replying to the enquiry addresses the visitor, not the website sender.
4. A missing name/email/message is blocked; invalid email and honeypot are rejected.
5. The browser shows an accurate error if SMTP is unavailable.
6. The form works at mobile width, from the approved Vercel origin, and is not reported as successful in offline mode.

The endpoint treats successful submission to Google's SMTP server as accepted for delivery; actual inbox arrival still needs checking. No active credentials or live delivery have been configured by this repository commit.

## Security & maintenance

- No account SMTP password is committed. The true config **must remain outside document root**.
- Origin/CORS checks protect browser requests but do **not** replace server-side abuse controls; the endpoint has a rate limit, hidden bot field and strict validation. Consider Cloudflare Turnstile if spam volume rises.
- The sender uses the authenticated SHOWSET identity. The visitor's email is used only as `Reply-To` to avoid spoofed From headers.
- Error responses never reveal SMTP passwords or message content. SMTP errors are logged generically on the PHP host.
- Keep PHP and PHPMailer supported and patched.

**Google Workspace reference:** https://knowledge.workspace.google.com/admin/gmail/send-email-from-a-printer-scanner-or-app

**xneelo SMTP and server reference:** https://xneelo.co.za/help-centre/email/email-settings/

**PHPMailer reference:** https://github.com/PHPMailer/PHPMailer/releases
