# FRMS Netlify Functions

Two serverless functions power dynamic features on the otherwise-static site.
Neither needs any npm dependencies — they use the Node 18+ built-in `fetch`.

Set the environment variables below in **Netlify → Site settings → Environment
variables**, then redeploy.

---

## 1. `paypal-webhook` — welcome email for new members

Sends a branded welcome email (via **Brevo**) when a membership payment
completes through the PayPal button on the Join page.

**Endpoint:** `https://<your-site>/.netlify/functions/paypal-webhook`
(also reachable at `/api/paypal-webhook`)

### What it does
1. Receives PayPal webhook events.
2. Verifies each event's signature with PayPal (rejects anything unverified).
3. On `PAYMENT.CAPTURE.COMPLETED`, resolves the payer's name + email
   (fetching the order from PayPal if the capture event omits them).
4. Sends the welcome email through Brevo's transactional API.

### Environment variables
| Variable | Required | Notes |
| --- | --- | --- |
| `PAYPAL_CLIENT_ID` | ✅ | REST app client id (PayPal Developer dashboard) |
| `PAYPAL_CLIENT_SECRET` | ✅ | REST app secret |
| `PAYPAL_WEBHOOK_ID` | ✅ | Id of the webhook you create (below) |
| `BREVO_API_KEY` | ✅ | Brevo → SMTP & API → API Keys |
| `FROM_EMAIL` | ✅ | A **verified** Brevo sender on your domain, e.g. `hello@yourdomain.org` |
| `FROM_NAME` | – | Sender name (default: `Front Range Mycological Society`) |
| `REPLY_TO_EMAIL` | – | Reply-to (default: `FROM_EMAIL`) |
| `PAYPAL_API_BASE` | – | `https://api-m.paypal.com` (live, default) or `https://api-m.sandbox.paypal.com` |
| `MEMBERSHIP_KEYWORD` | – | See "Avoiding donor emails" below |

### PayPal setup
1. Create a REST app at <https://developer.paypal.com/dashboard/applications>
   (Live) and copy its **Client ID** and **Secret**.
2. In that app, add a **Webhook** pointing to
   `https://<your-site>/.netlify/functions/paypal-webhook`.
3. Subscribe it to the **`PAYMENT.CAPTURE.COMPLETED`** event (at minimum).
4. Copy the generated **Webhook ID** into `PAYPAL_WEBHOOK_ID`.

### Brevo setup
1. Create/verify a sender or authenticate your sending **domain** in Brevo
   (Senders, Domains & Dedicated IPs). `FROM_EMAIL` must be verified.
2. Create an API key (SMTP & API → API Keys) and set `BREVO_API_KEY`.

### Avoiding donor emails ⚠️
PayPal fires this webhook for **every** completed payment on the account,
including donations. To only welcome membership purchases, set
`MEMBERSHIP_KEYWORD` (e.g. `member`) — the function then only emails when the
purchase's item name / description / custom id contains that text
(case-insensitive). Give the membership PayPal button an item/product name that
contains the keyword (e.g. "FRMS Membership"). If `MEMBERSHIP_KEYWORD` is unset,
**all** completed payments get the welcome email.

---

## 2. `eventbrite-events` — upcoming events for the home page

Fetches upcoming live events from the Eventbrite API and returns a small,
pre-formatted JSON payload (name, date, time, venue, summary, ticket URL) so the
home page can render real event details.

**Endpoint:** `https://<your-site>/.netlify/functions/eventbrite-events`
(also reachable at `/api/eventbrite-events`)

### Environment variables
| Variable | Required | Notes |
| --- | --- | --- |
| `EVENTBRITE_API_TOKEN` | ✅ | Eventbrite → Account Settings → Developer → API keys (Private token) |
| `EVENTBRITE_ORGANIZATION_ID` | – | Which org's events to list. If omitted, the first org on the token is used. |
| `EVENTBRITE_EVENT_IDS` | – | Comma-separated event ids to return specific events instead of listing live org events. |

### Response shape
```json
{
  "events": [
    {
      "id": "2000199002059",
      "name": "Mushroom Foray",
      "url": "https://www.eventbrite.com/e/...",
      "date": "Sunday, September 13, 2026",
      "time": "12:00 PM – 3:00 PM MDT",
      "venue": "Ward, Colorado",
      "summary": "…",
      "image": "https://img.evbuc.com/...",
      "soldOut": false
    }
  ]
}
```

### Wiring the home page to it (optional, later)
The home page currently shows a static event card. To drive it from live data,
fetch `/api/eventbrite-events` on load and render the returned `events` into the
Upcoming Events section, falling back to the static card if the request fails or
returns none.

---

## Local development
```bash
npm install -g netlify-cli   # one time
netlify dev                  # serves the site + functions locally
```
Set the same environment variables locally (a `.env` file works with
`netlify dev`). **Never commit real keys** — they belong only in Netlify's
environment settings.
