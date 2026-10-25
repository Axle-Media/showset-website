<?php
// Copy to config.local.php, configure, never commit this file with credentials.
return [
 'db_host' => 'localhost',
 'db_port' => 3306,
 'db_name' => 'YOUR_DB',
 'db_user' => 'YOUR_USER',
 'db_pass' => 'YOUR_PASSWORD',
 'admin_user' => 'showset-admin',
 // Generate: php -r 'echo password_hash("your long unique password", PASSWORD_DEFAULT), "\n";'
 'admin_password_hash' => 'PASTE_HASH_HERE',
 // Separate password for the temporary website preview gate. Never commit the real hash.
 // Generate with: php -r 'echo password_hash("your preview password", PASSWORD_DEFAULT), PHP_EOL;'
 'preview_password_hash' => 'PASTE_PREVIEW_HASH_HERE',
 'contact_email' => '', // Real destination inbox: required to enable contact form.
 'max_upload_bytes' => 5000000,
];
