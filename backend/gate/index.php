<?php
declare(strict_types=1);

/*
 * SHOWSET preview gate for standard PHP hosting.
 * The exported Next.js site lives in /protected-site and is only served
 * through this controller after the preview password has been verified.
 */
ini_set('display_errors', '0');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
header('X-Frame-Options: DENY');
header('Permissions-Policy: camera=(), microphone=(), geolocation=()');

$https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
session_name('SHOWSETPREVIEW');
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => $https,
    'httponly' => true,
    'samesite' => 'Strict',
]);
session_start();

function gate_json(array $data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, max-age=0');
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function gate_not_found(): never
{
    http_response_code(404);
    header('Cache-Control: no-store, max-age=0');
    header('Content-Type: text/plain; charset=utf-8');
    echo 'Not found';
    exit;
}

function gate_is_authorized(): bool
{
    return !empty($_SESSION['showset_preview_authenticated'])
        && $_SESSION['showset_preview_authenticated'] === true;
}

function gate_same_origin(): bool
{
    if (empty($_SERVER['HTTP_ORIGIN'])) {
        return true;
    }
    $origin = parse_url((string) $_SERVER['HTTP_ORIGIN']);
    $host = strtolower((string) ($origin['host'] ?? ''));
    $expected = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
    if (str_contains($expected, ':')) {
        $expected = explode(':', $expected, 2)[0];
    }
    return $host !== '' && hash_equals($expected, $host);
}

function gate_rate_file(): string
{
    return rtrim(sys_get_temp_dir(), DIRECTORY_SEPARATOR)
        . DIRECTORY_SEPARATOR . 'showset-preview-login-'
        . hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown')) . '.json';
}

/** Allow at most eight password attempts per IP in a fifteen-minute window. */
function gate_consume_attempt(): bool
{
    $file = gate_rate_file();
    $handle = @fopen($file, 'c+');
    if (!$handle) {
        return false;
    }
    if (!flock($handle, LOCK_EX)) {
        fclose($handle);
        return false;
    }
    rewind($handle);
    $raw = stream_get_contents($handle);
    $state = is_string($raw) ? json_decode($raw, true) : null;
    $now = time();
    if (!is_array($state) || !isset($state['start'], $state['count']) || $now - (int) $state['start'] >= 900) {
        $state = ['start' => $now, 'count' => 0];
    }
    if ((int) $state['count'] >= 8) {
        flock($handle, LOCK_UN);
        fclose($handle);
        return false;
    }
    $state['count'] = (int) $state['count'] + 1;
    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($state));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
    return true;
}

function gate_clear_attempts(): void
{
    $file = gate_rate_file();
    if (is_file($file)) {
        @unlink($file);
    }
}

function gate_redirect_target(): string
{
    $target = (string) ($_SESSION['showset_preview_next'] ?? '/');
    unset($_SESSION['showset_preview_next']);
    if ($target === '' || $target[0] !== '/' || str_starts_with($target, '//') || str_contains($target, '\\')) {
        return '/';
    }
    return $target;
}

function gate_login_response(array $data, int $status, bool $jsonRequest): never
{
    if ($jsonRequest) {
        gate_json($data, $status);
    }
    if (empty($data['ok'])) {
        $_SESSION['showset_preview_notice'] = (string) ($data['error'] ?? 'Unable to sign in.');
        header('Location: /', true, 303);
        exit;
    }
    $redirect = (string) ($data['redirect'] ?? '/');
    if ($redirect === '' || $redirect[0] !== '/' || str_starts_with($redirect, '//') || str_contains($redirect, '\\')) {
        $redirect = '/';
    }
    header('Location: ' . $redirect, true, 303);
    exit;
}

$gateAction = (string) ($_GET['gate'] ?? '');
$path = (string) ($_GET['path'] ?? '');
$path = ltrim($path, '/');
$jsonRequest = strtolower((string) ($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '')) === 'xmlhttprequest'
    || str_contains(strtolower((string) ($_SERVER['HTTP_ACCEPT'] ?? '')), 'application/json');

if ($gateAction === 'login') {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        gate_login_response(['ok' => false, 'error' => 'Please submit the form again.'], 405, $jsonRequest);
    }
    if (!gate_same_origin()) {
        gate_login_response(['ok' => false, 'error' => 'This request could not be verified.'], 403, $jsonRequest);
    }
    $submittedCsrf = (string) ($_POST['csrf'] ?? '');
    $sessionCsrf = (string) ($_SESSION['showset_preview_csrf'] ?? '');
    if ($sessionCsrf === '' || $submittedCsrf === '' || !hash_equals($sessionCsrf, $submittedCsrf)) {
        gate_login_response(['ok' => false, 'error' => 'Your session expired. Close this window and try again.'], 403, $jsonRequest);
    }
    if (!gate_consume_attempt()) {
        gate_login_response(['ok' => false, 'error' => 'Too many attempts. Please wait 15 minutes before trying again.'], 429, $jsonRequest);
    }

    $configPath = __DIR__ . '/api/showset/config.local.php';
    $config = is_file($configPath) ? require $configPath : null;
    $hash = is_array($config) ? (string) ($config['preview_password_hash'] ?? '') : '';
    $hashInfo = $hash !== '' ? password_get_info($hash) : ['algoName' => 'unknown'];
    if ($hash === '' || str_starts_with($hash, 'PASTE_') || ($hashInfo['algoName'] ?? 'unknown') === 'unknown') {
        gate_login_response(['ok' => false, 'error' => 'Preview access has not been configured on the server yet.'], 503, $jsonRequest);
    }

    $password = (string) ($_POST['password'] ?? '');
    if (strlen($password) > 512 || !password_verify($password, $hash)) {
        gate_login_response(['ok' => false, 'error' => 'That password did not match. Please try again.'], 401, $jsonRequest);
    }

    gate_clear_attempts();
    session_regenerate_id(true);
    $_SESSION['showset_preview_authenticated'] = true;
    $_SESSION['showset_preview_csrf'] = bin2hex(random_bytes(32));
    unset($_SESSION['showset_preview_notice']);
    gate_login_response(['ok' => true, 'redirect' => gate_redirect_target()], 200, $jsonRequest);
}

if (gate_is_authorized()) {
    if ($path === 'api/showset/index.php') {
        // Persist the preview session, then let the Studio API open its own session.
        session_write_close();
        require __DIR__ . '/api/showset/index.php';
        exit;
    }
    // Static responses do not need the gate session lock. Release it before disk I/O.
    session_write_close();

    // Never expose backend PHP source or local configuration through the file gateway.
    if (str_starts_with($path, 'api/showset/')) {
        gate_not_found();
    }
    if ($path === 'protected-site' || str_starts_with($path, 'protected-site/')
        || str_contains($path, '\\') || str_contains($path, "\0")
        || preg_match('~(^|/)\.\.?(/|$)~', $path)) {
        gate_not_found();
    }

    $protectedRoot = realpath(__DIR__ . '/protected-site');
    if ($protectedRoot === false) {
        http_response_code(503);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'The preview website has not been packaged yet.';
        exit;
    }

    $relative = $path === '' ? 'index.html' : $path;
    $candidate = $protectedRoot . DIRECTORY_SEPARATOR . $relative;
    if (is_dir($candidate)) {
        $candidate .= DIRECTORY_SEPARATOR . 'index.html';
    } elseif (!is_file($candidate) && pathinfo($candidate, PATHINFO_EXTENSION) === '') {
        $candidate .= DIRECTORY_SEPARATOR . 'index.html';
    }
    $resolved = realpath($candidate);
    if ($resolved === false || !is_file($resolved)
        || !str_starts_with($resolved, $protectedRoot . DIRECTORY_SEPARATOR)) {
        gate_not_found();
    }

    $types = [
        'html' => 'text/html; charset=utf-8',
        'css' => 'text/css; charset=utf-8',
        'js' => 'application/javascript; charset=utf-8',
        'mjs' => 'application/javascript; charset=utf-8',
        'json' => 'application/json; charset=utf-8',
        'svg' => 'image/svg+xml',
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'webp' => 'image/webp',
        'gif' => 'image/gif',
        'avif' => 'image/avif',
        'ico' => 'image/x-icon',
        'woff' => 'font/woff',
        'woff2' => 'font/woff2',
        'ttf' => 'font/ttf',
        'otf' => 'font/otf',
        'mp4' => 'video/mp4',
        'webm' => 'video/webm',
        'pdf' => 'application/pdf',
        'txt' => 'text/plain; charset=utf-8',
        'xml' => 'application/xml; charset=utf-8',
        'webmanifest' => 'application/manifest+json',
    ];
    $extension = strtolower(pathinfo($resolved, PATHINFO_EXTENSION));
    header('Content-Type: ' . ($types[$extension] ?? 'application/octet-stream'));
    if ($extension === 'html') {
        header('Cache-Control: private, no-store, max-age=0');
    } else {
        header('Cache-Control: private, max-age=3600');
    }
    header('Vary: Cookie');
    readfile($resolved);
    exit;
}

// Do not disclose protected HTML, app bundles, content JSON, or media to visitors.
if (str_starts_with($path, 'api/') || str_starts_with($path, '_next/')
    || str_starts_with($path, 'media/') || str_starts_with($path, 'fonts/')
    || pathinfo($path, PATHINFO_EXTENSION) !== '') {
    gate_not_found();
}

$requestedPath = $path === '' ? '/' : '/' . $path;
if ($requestedPath !== '/' && !str_ends_with($requestedPath, '/')) {
    $requestedPath .= '/';
}
if (!str_starts_with($requestedPath, '//') && !str_contains($requestedPath, '\\')) {
    $_SESSION['showset_preview_next'] = $requestedPath;
} else {
    $_SESSION['showset_preview_next'] = '/';
}
if (empty($_SESSION['showset_preview_csrf'])) {
    $_SESSION['showset_preview_csrf'] = bin2hex(random_bytes(32));
}
$csrf = htmlspecialchars((string) $_SESSION['showset_preview_csrf'], ENT_QUOTES, 'UTF-8');
$notice = (string) ($_SESSION['showset_preview_notice'] ?? '');
unset($_SESSION['showset_preview_notice']);
$noticeHtml = htmlspecialchars($notice, ENT_QUOTES, 'UTF-8');
$autoOpen = $notice !== '' ? 'true' : 'false';

header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
header("Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");

$html = <<<'HTML'
<!doctype html>
<html lang="en-GB">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#0d2f49">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="csrf-token" content="%%CSRF%%">
  <title>SHOWSET | New website coming soon</title>
  <link rel="icon" href="/gate-assets/approved-icon.png" type="image/png">
  <link rel="stylesheet" href="/gate-assets/gate.css?v=20261026-1">
  <script src="/gate-assets/gate.js?v=20261026-1" defer></script>
</head>
<body data-open-modal="%%AUTOOPEN%%">
  <main class="cover" aria-label="SHOWSET website">
    <div class="cover-pattern" aria-hidden="true"></div>
    <div class="cover-content">
      <button class="gate-brand" id="open-access-modal" type="button" aria-label="Open password access" aria-haspopup="dialog" aria-controls="access-modal">
        <img src="/gate-assets/approved-wordmark.png" alt="SHOWSET">
      </button>
    </div>
    <footer class="cover-footer" aria-label="Contact and social links">
      <div class="cover-contact">
        <a href="mailto:hello@showset.co.za">hello@showset.co.za</a>
        <span class="footer-separator" aria-hidden="true"></span>
        <a href="tel:+27682805777">+27 68 280 5777</a>
        <span class="footer-separator" aria-hidden="true"></span>
        <span>Cape Town, South Africa</span>
      </div>
      <nav class="footer-socials" aria-label="Social media">
        <a class="footer-social" href="https://www.facebook.com/madebyshowset" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3"/></svg>
        </a>
        <a class="footer-social" href="https://www.instagram.com/madebyshowset" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></svg>
        </a>
        <a class="footer-social" href="https://www.linkedin.com/company/madebyshowset" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
        </a>
      </nav>
    </footer>
  </main>

  <dialog class="access-modal" id="access-modal" aria-label="Password access">
    <form class="modal-card" id="preview-login-form" method="post" action="/?gate=login" novalidate>
      <button class="modal-close" type="button" id="close-access-modal" aria-label="Close">×</button>
      <input type="hidden" name="csrf" value="%%CSRF%%">
      <input class="password-input" id="preview-password" name="password" type="password" autocomplete="current-password" placeholder="Password" aria-label="Password" required maxlength="512" aria-describedby="login-status">
      <p class="login-status sr-only" id="login-status" role="status" aria-live="polite">%%NOTICE%%</p>
      <button class="modal-submit" id="submit-preview-login" type="submit">
        <span class="submit-label">Submit</span>
      </button>
    </form>
  </dialog>
</body>
</html>
HTML;

echo str_replace(
    ['%%CSRF%%', '%%AUTOOPEN%%', '%%NOTICE%%'],
    [$csrf, $autoOpen, $noticeHtml],
    $html
);