<?php
declare(strict_types=1);

/**
 * COPY AND RENAME to showset-private/contact-config.php,
 * OUTSIDE the public_html / website root. Never commit this real file.
 *
 * Google Workspace SMTP: use a dedicated app password (not your normal
 * login password); available only when the account/admin allows it.
 * Or replace with your authenticated SMTP relay details.
 */
return [
    'allowed_origins' => [
        'https://showset-website.vercel.app',
        'https://showset.co.za',
        'https://www.showset.co.za',
        // Explicitly add any additional Vercel preview URL you need to test.
        // Never use '*' or allow every *.vercel.app site.
    ],
    'recipient' => 'hello@showset.co.za',
    'sender' => 'hello@showset.co.za',
    'smtp' => [
        'host' => 'smtp.gmail.com',
        'port' => 587,
        'username' => 'hello@showset.co.za',
        'password' => 'REPLACE_WITH_GOOGLE_WORKSPACE_APP_PASSWORD',
    ],
    // Replace with at least 32 random characters before deployment.
    // Generate locally: php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
    'rate_key' => 'REPLACE_WITH_A_UNIQUE_64_CHARACTER_RANDOM_HEX_SECRET',
    'rate_dir' => __DIR__ . '/rate',
];
