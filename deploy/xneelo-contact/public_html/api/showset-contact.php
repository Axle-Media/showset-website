<?php
declare(strict_types=1);

/**
 * SHOWSET website enquiry endpoint for PHP-capable xneelo hosting.
 *
 * Place this file at public_html/api/showset-contact.php and the matching
 * showset-private/contact-config.php OUTSIDE public_html.
 * Never put SMTP credentials in this file or in a Git repository.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header("Content-Security-Policy: default-src 'none'");
header('Vary: Origin');

function respond(int $status, string $code): never
{
    http_response_code($status);
    echo json_encode(['ok' => $status >= 200 && $status < 300, 'code' => $code], JSON_UNESCAPED_SLASHES);
    exit;
}

$configPath = getenv('SHOWSET_CONTACT_CONFIG') ?: dirname(__DIR__, 2) . '/showset-private/contact-config.php';
if (!is_file($configPath) || !is_readable($configPath)) {
    respond(503, 'not_configured');
}
$config = require $configPath;
if (!is_array($config)) {
    respond(503, 'not_configured');
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = $config['allowed_origins'] ?? [];
if (!is_string($origin) || !is_array($allowedOrigins) || !in_array($origin, $allowedOrigins, true)) {
    respond(403, 'origin_not_allowed');
}
header('Access-Control-Allow-Origin: ' . $origin);
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Max-Age: 600');

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($method !== 'POST') {
    header('Allow: POST, OPTIONS');
    respond(405, 'method_not_allowed');
}

$mediaType = strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]));
if ($mediaType !== 'application/json') {
    respond(415, 'json_required');
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 15000) {
    respond(413, 'payload_too_large');
}
$raw = file_get_contents('php://input', false, null, 0, 15001);
if (!is_string($raw) || strlen($raw) > 15000) {
    respond(413, 'payload_too_large');
}
$input = json_decode($raw, true);
if (!is_array($input) || array_is_list($input)) {
    respond(400, 'invalid_json');
}

function field(array $input, string $name, int $maxLength, bool $required = false): string
{
    $value = $input[$name] ?? '';
    if (!is_string($value)) {
        respond(422, 'invalid_fields');
    }
    $value = trim($value);
    $length = function_exists('mb_strlen') ? mb_strlen($value, 'UTF-8') : strlen($value);
    if ($length > $maxLength || ($required && $value === '') || preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', $value)) {
        respond(422, 'invalid_fields');
    }
    return $value;
}

$clientIp = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateKey = (string) ($config['rate_key'] ?? '');
$rateDir = (string) ($config['rate_dir'] ?? sys_get_temp_dir() . '/showset-contact-throttle');
if (strlen($rateKey) < 32 || !is_dir($rateDir) && !@mkdir($rateDir, 0700, true) && !is_dir($rateDir)) {
    respond(503, 'server_unavailable');
}

$bucket = hash_hmac('sha256', $clientIp, $rateKey);
$path = rtrim($rateDir, '/\\') . '/' . $bucket . '.json';
$handle = @fopen($path, 'c+');
if (!$handle || !flock($handle, LOCK_EX)) {
    if ($handle) fclose($handle);
    respond(503, 'server_unavailable');
}
@chmod($path, 0600);
$now = time();
$existing = json_decode((string) stream_get_contents($handle), true);
$attempts = is_array($existing) ? array_values(array_filter($existing, static fn ($v): bool => is_int($v) && $v > $now - 3600)) : [];
$recent = count(array_filter($attempts, static fn (int $v): bool => $v > $now - 600));
if ($recent >= 4 || count($attempts) >= 12) {
    flock($handle, LOCK_UN);
    fclose($handle);
    header('Retry-After: 600');
    respond(429, 'rate_limited');
}
$attempts[] = $now;
ftruncate($handle, 0);
rewind($handle);
fwrite($handle, json_encode($attempts));
fflush($handle);
flock($handle, LOCK_UN);
fclose($handle);

if (field($input, 'website', 200) !== '') {
    // Honeypot: no SMTP, no misleading success confirmation.
    respond(422, 'invalid_fields');
}

$name = field($input, 'name', 120, true);
$email = field($input, 'email', 254, true);
$type = field($input, 'type', 120);
$message = field($input, 'message', 5000, true);
$company = field($input, 'company', 160);
$date = field($input, 'date', 120);
$budget = field($input, 'budget', 120);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(422, 'invalid_fields');
}
$allowedTypes = [
    '', 'An event or experience', 'A brand or design project',
    'A website or digital solution', 'Marketing and content',
    'Film or production', 'A bit of everything', 'Not quite sure yet',
];
if (!in_array($type, $allowedTypes, true)) {
    respond(422, 'invalid_fields');
}

$smtp = $config['smtp'] ?? [];
$recipient = $config['recipient'] ?? 'hello@showset.co.za';
$sender = $config['sender'] ?? 'hello@showset.co.za';
if (!is_array($smtp) ||
    empty($smtp['host']) || empty($smtp['username']) || empty($smtp['password']) ||
    !filter_var($recipient, FILTER_VALIDATE_EMAIL) || !filter_var($sender, FILTER_VALIDATE_EMAIL)) {
    respond(503, 'not_configured');
}

$library = __DIR__ . '/phpmailer/src/';
foreach (['Exception', 'PHPMailer', 'SMTP'] as $class) {
    if (!is_file($library . $class . '.php')) {
        respond(503, 'server_unavailable');
    }
    require_once $library . $class . '.php';
}

use PHPMailer\PHPMailer\PHPMailer;

$details = [
    'Name' => $name,
    'Email' => $email,
    'Project type' => $type ?: 'Not specified',
    'Company / organisation' => $company ?: 'Not specified',
    'Timing' => $date ?: 'Not specified',
    'Budget' => $budget ?: 'Not specified',
    'Message' => $message,
];
$body = "New enquiry from the SHOWSET website\n\n";
foreach ($details as $label => $value) {
    $body .= $label . ":\n" . $value . "\n\n";
}

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = (string) $smtp['host'];
    $mail->SMTPAuth = true;
    $mail->Username = (string) $smtp['username'];
    $mail->Password = (string) $smtp['password'];
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = (int) ($smtp['port'] ?? 587);
    $mail->SMTPAutoTLS = true;
    $mail->Timeout = 12;
    $mail->CharSet = PHPMailer::CHARSET_UTF8;
    $mail->setFrom($sender, 'SHOWSET Website');
    $mail->addAddress($recipient);
    $mail->addReplyTo($email, $name);
    $mail->Subject = 'SHOWSET website enquiry' . ($type ? ' | ' . $type : '');
    $mail->Body = $body;
    $mail->isHTML(false);
    $mail->send();
    respond(200, 'accepted_by_smtp');
} catch (Throwable $exception) {
    // Never expose message contents, SMTP credentials or mailer errors in HTTP.
    error_log('SHOWSET contact: outbound SMTP submission failed (' . get_class($exception) . ')');
    respond(502, 'delivery_failed');
}
