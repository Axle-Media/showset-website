# SHOWSET contact delivery and rollout

## Current public static build

The Contact form intentionally does **not** claim a message was delivered on Vercel or a static xneelo export. Until a verified delivery endpoint is configured, it composes a populated email draft for the visitor's email application. The visitor must review and press **Send** in that application. The form's helper copy, button label and status message communicate this explicitly. Direct mail and telephone links remain available.

No credentials are embedded in the browser. The destination address comes from the published footer contact setting, with `hello@showset.co.za` as the known fallback.

## Optional server-side delivery activation

Set `NEXT_PUBLIC_SHOWSET_CONTACT_ENDPOINT` to a verified HTTPS endpoint (or a same-origin route on an actual backend) **at build time**. The static-exported client will then post JSON with `name`, `email`, `type`, `message`, `company`, `date`, `budget`, and the `website` honeypot.

The endpoint must:
- Accept POST with Content-Type application/json and return a **non-2xx response on failed delivery**.
- Validate and sanitize required fields, lengths, and email format on the server. Do not trust the honeypot alone.
- Reject non-empty `website` and provide rate limiting/spam protection and appropriate CORS policy when hosted at another origin.
- Send the enquiry using an authenticated provider or SMTP relay and log only necessary diagnostic metadata.
- Use a secure server-side address/credential configuration; never expose email provider secrets to the browser.
- Only return a 2xx response after the submission has actually been accepted for delivery.

Once configured and verified with a real end-to-end test, the interface automatically switches from **Prepare the email** to **Send the idea**, and success is displayed only after a successful API response. A successful static build or an HTTP response alone does not prove inbox delivery: test the actual receiving inbox, failures and spam handling before launch.

## Verification

GitHub Actions runs `qa/contact-experience.cjs` at desktop, tablet, and small-phone widths. It verifies the static heading contract, photograph, layout, no misleading submission confirmation, form validation, project selector, and direct contact methods. Full-page desktop and mobile review screenshots are retained as artifacts.

Do not alter the approved global typography, service-page headings or navigation in contact-specific styling.
