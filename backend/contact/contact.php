<?php
declare(strict_types=1);

/**
 * Public SHOWSET contact form endpoint for xneelo Apache/PHP hosting.
 * This is deliberately separate from the private SHOWSET Studio PHP backend.
 * No secret configuration, user-supplied recipient or database is required.
 */
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');

function respond(int $status, string $code, bool $ok = false): never
{
    http_response_code($status);
    header('Allow: POST', true);
    echo json_encode(['ok' => $ok, 'code' => $code], JSON_UNESCAPED_SLASHES);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, 'method_not_allowed');
}

// Browsers send Origin on fetch() JSON POST. This endpoint intentionally
// accepts only the two public website origins, never arbitrary CORS origins.
$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
if (!in_array($origin, ['https://showset.co.za', 'https://www.showset.co.za'], true)) {
    respond(403, 'invalid_origin');
}
$contentType = strtolower(trim(explode(';', (string) ($_SERVER['CONTENT_TYPE'] ?? ''), 2)[0]));
if ($contentType !== 'application/json') {
    respond(415, 'invalid_content_type');
}
$size = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
if ($size < 1 || $size > 16000) {
    respond(413, 'invalid_payload_size');
}
$raw = file_get_contents('php://input', false, null, 0, 16001);
if ($raw === false || strlen($raw) > 16000) {
    respond(413, 'invalid_payload_size');
}
try {
    $data = json_decode($raw, true, 24, JSON_THROW_ON_ERROR);
} catch (JsonException $exception) {
    respond(400, 'invalid_json');
}
if (!is_array($data) || array_is_list($data)) {
    respond(400, 'invalid_payload');
}

function field(array $data, string $name, int $limit): string
{
    $value = $data[$name] ?? '';
    if (!is_string($value) || strlen($value) > $limit * 4) {
        respond(422, 'invalid_field');
    }
    $value = trim(str_replace("\0", '', $value));
    if (strlen($value) > $limit) {
        respond(422, 'invalid_field');
    }
    return $value;
}

$website = field($data, 'website', 300);
// The hidden field is only one layer of spam defence; return no delivery
// acknowledgement because the enquiry has not actually been queued.
if ($website !== '') {
    respond(200, 'filtered');
}
$name = field($data, 'name', 120);
$email = field($data, 'email', 254);
$message = field($data, 'message', 5000);
$company = field($data, 'company', 160);
$type = field($data, 'type', 120);
$date = field($data, 'date', 120);
$budget = field($data, 'budget', 120);

if (
    $name === '' || strlen($name) < 2 ||
    strlen($message) < 3 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) ||
    preg_match('/[\x00-\x1f\x7f]/', $name . $email) ||
    preg_match('/[\r\n]/', $company . $type . $date . $budget)
) {
    respond(422, 'validation_failed');
}

// Fixed small per-IP throttle; do not trust X-Forwarded-For from clients.
// Locking keeps simultaneous submissions from bypassing the counter.
$clientIp = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$key = hash('sha256', 'showset-public-contact-v1|' . $clientIp);
$limiter = rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR) .
    DIRECTORY_SEPARATOR . 'showset_contact_' . $key . '.rate';
$lock = @fopen($limiter, 'c+');
if ($lock === false || !flock($lock, LOCK_EX)) {
    if (is_resource($lock)) {
        fclose($lock);
    }
    error_log('SHOWSET form: rate-limit store unavailable');
    respond(503, 'temporarily_unavailable');
}
@chmod($limiter, 0600);
$existing = stream_get_contents($lock);
$state = json_decode($existing ?: '{}', true);
$now = time();
$start = (int) ($state['start'] ?? 0);
$count = (int) ($state['count'] ?? 0);
if ($now - $start >= 3600 || $start > $now) {
    $start = $now;
    $count = 0;
}
if ($count >= 6) {
    flock($lock, LOCK_UN);
    fclose($lock);
    header('Retry-After: 3600');
    respond(429, 'rate_limited');
}
rewind($lock);
ftruncate($lock, 0);
$written = fwrite($lock, json_encode(['start' => $start, 'count' => $count + 1]));
fflush($lock);
flock($lock, LOCK_UN);
fclose($lock);
if ($written === false) {
    error_log('SHOWSET form: rate-limit store write failed');
    respond(503, 'temporarily_unavailable');
}

// Never use user text as the From identity, recipient or subject.
// A fixed domain sender avoids arbitrary SMTP header injection.
$body = implode("\n", [
    'New enquiry submitted through the SHOWSET website',
    '',
    'Name: ' . $name,
    'Email: ' . $email,
    'Company / organisation: ' . $company,
    'What we are making: ' . $type,
    'Event or launch date: ' . $date,
    'Rough budget: ' . $budget,
    '',
    'The idea:',
    $message,
    '',
    '--',
    'Submitted through showset.co.za/contact/',
]);
$headers = [
    'From: SHOWSET Website <no-reply@showset.co.za>',
    'Reply-To: ' . $email,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Contact-Source: SHOWSET Website',
];

try {
    $queued = @mail(
        'hello@showset.co.za',
        'New SHOWSET website enquiry',
        $body,
        implode("\r\n", $headers)
    );
} catch (Throwable $exception) {
    $queued = false;
}
if (!$queued) {
    error_log('SHOWSET form: local mail transport rejected enquiry');
    respond(503, 'mail_transport_failed');
}

// PHP mail() only confirms acceptance by the local mail transport, NOT
// delivery into the Google Workspace inbox. Verify via a real test.
respond(200, 'accepted_for_delivery', true);
