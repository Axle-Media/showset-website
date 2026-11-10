#!/usr/bin/env bash
# Exercise the packaged PHP endpoint without sending real mail.
# Uses /bin/true as a fake mail transport, not an actual delivery.
set -euo pipefail

DOCROOT="${1:-dist/xneelo-public}"
PORT=18463
LOG="$(mktemp)"
php -d sendmail_path=/bin/true -S "127.0.0.1:$PORT" -t "$DOCROOT" >"$LOG" 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true; wait "$SERVER_PID" 2>/dev/null || true; rm -f "$LOG"' EXIT

URL="http://127.0.0.1:$PORT/api/contact.php"
for _ in $(seq 1 40); do
  if curl -sf --max-time 1 "http://127.0.0.1:$PORT/" >/dev/null 2>&1; then break; fi
  sleep 0.2
done

check() {
  local title="$1" wanted="$2" code="$3"
  shift 3
  local response http body
  response="$(curl -sS --max-time 5 -w $'\n%{http_code}' "$@" "$URL")"
  http="${response##*$'\n'}"
  body="${response%$'\n'*}"
  if [[ "$http" != "$wanted" || "$body" != *"\"code\":\"$code\""* ]]; then
    echo "FAIL $title: HTTP $http, body $body"
    cat "$LOG"
    exit 1
  fi
  echo "PASS $title ($http: $code)"
}

JSON='{"name":"Test Person","email":"test@example.org","message":"Test contact enquiry for PHP endpoint.","website":"","company":"Test Ltd","type":"An event or experience","date":"2027","budget":"Prefer to discuss"}'
check "GET blocked" 405 method_not_allowed
check "Cross-site request blocked" 403 invalid_origin \
  -H "Origin: https://attacker.example" -H "Content-Type: application/json" -d "$JSON"
check "Wrong content type rejected" 415 invalid_content_type \
  -H "Origin: https://showset.co.za" -d "$JSON"
check "Invalid JSON rejected" 400 invalid_json \
  -H "Origin: https://showset.co.za" -H "Content-Type: application/json" -d '{"broken":'
check "Honeypot suppressed" 200 filtered \
  -H "Origin: https://showset.co.za" -H "Content-Type: application/json" \
  -d '{"website":"filled"}'
for n in $(seq 1 6); do
  check "Valid enquiry $n" 200 accepted_for_delivery \
    -H "Origin: https://showset.co.za" -H "Content-Type: application/json" -d "$JSON"
done
check "Per-IP rate limit" 429 rate_limited \
  -H "Origin: https://showset.co.za" -H "Content-Type: application/json" -d "$JSON"

echo "PASS PHP contact endpoint isolated delivery smoke checks"
