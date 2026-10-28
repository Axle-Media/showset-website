#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
public="$root/deploy/xneelo-contact/public_html"
phpfile="$public/api/showset-contact.php"
php -l "$phpfile"
for source in "$public"/api/phpmailer/src/*.php; do php -l "$source"; done
php -l "$root/deploy/xneelo-contact/showset-private/contact-config.example.php"

tmp="$(mktemp -d)"
port=19088
pid=""
trap 'if [ -n "$pid" ]; then kill "$pid" 2>/dev/null || true; fi; rm -rf "$tmp"' EXIT
cat > "$tmp/config.php" <<PHP
<?php
return [
 'allowed_origins' => ['https://showset-website.vercel.app'],
 'recipient'=>'hello@showset.co.za',
 'sender'=>'hello@showset.co.za',
 'rate_key'=>str_repeat('ab', 32),
 'rate_dir'=>'$tmp/ratelimit',
 'smtp'=>['host'=>'127.0.0.1','port'=>587,'username'=>'test@showset.co.za','password'=>'not-used'],
];
PHP
SHOWSET_CONTACT_CONFIG="$tmp/config.php" php -S "127.0.0.1:$port" -t "$public" > "$tmp/server.log" 2>&1 &
pid=$!
for i in $(seq 1 40); do
  if curl -sS --max-time 1 "http://127.0.0.1:$port/api/showset-contact.php" >/dev/null; then break; fi
  sleep .25
done
base="http://127.0.0.1:$port/api/showset-contact.php"
origin="https://showset-website.vercel.app"

check() {
 expected="$1"; label="$2"; shift 2
 status="$(curl -sS --max-time 10 -o "$tmp/response" -w '%{http_code}' "$@" "$base")"
 if [ "$status" != "$expected" ]; then
   printf 'FAIL %s expected %s got %s, response: ' "$label" "$expected" "$status"
   cat "$tmp/response"; printf '\n'
   exit 1
 fi
 echo "PASS $label ($status)"
}
check 403 "Deny unknown origin" -H "Origin: https://untrusted.example" -X OPTIONS
check 204 "Allow known preflight" -X OPTIONS -H "Origin: $origin" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type"
check 405 "Reject GET" -H "Origin: $origin"
check 415 "Require JSON" -X POST -H "Origin: $origin" --data "hello"
check 400 "Reject malformed JSON" -X POST -H "Origin: $origin" -H "Content-Type: application/json" --data '{'
check 422 "Reject invalid email" -X POST -H "Origin: $origin" -H "Content-Type: application/json" --data '{"name":"Visitor","email":"not-email","message":"hello","website":""}'
check 422 "Reject honeypot" -X POST -H "Origin: $origin" -H "Content-Type: application/json" --data '{"name":"Visitor","email":"visitor@example.com","message":"hello","website":"spam"}'
check 422 "Reject missing required message" -X POST -H "Origin: $origin" -H "Content-Type: application/json" --data '{"name":"Visitor","email":"visitor@example.com","message":"","website":""}'
check 429 "Rate limit repeated requests" -X POST -H "Origin: $origin" -H "Content-Type: application/json" --data '{"name":"Visitor","email":"visitor@example.com","message":"hello","website":""}'
echo "PASS PHP handler security smoke tests (no mail sent)"
