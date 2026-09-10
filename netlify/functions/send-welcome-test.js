// Test endpoint: send the real welcome email without PayPal.
//
// Lets you verify Brevo config + sender verification + the template by hitting
// a URL. It calls the SAME sendWelcomeEmail() the PayPal webhook uses.
//
// Gated by a secret so it can't be abused to send mail:
//   WELCOME_TEST_SECRET  (required) — if unset, the endpoint is disabled (403).
//
// Usage (GET or POST):
//   /.netlify/functions/send-welcome-test?key=<WELCOME_TEST_SECRET>&to=you@example.com&name=Sky
//   - to   (required) recipient address
//   - name (optional) used for the greeting ("Hi <first word>,")

const { sendWelcomeEmail } = require('../lib/welcome-email');

exports.handler = async (event) => {
  const secret = process.env.WELCOME_TEST_SECRET;
  if (!secret) {
    return json(403, { error: 'Test endpoint disabled. Set WELCOME_TEST_SECRET to enable it.' });
  }

  const params = event.queryStringParameters || {};
  if (params.key !== secret) {
    return json(401, { error: 'Invalid or missing ?key' });
  }

  const to = (params.to || '').trim();
  if (!to) {
    return json(400, { error: 'Missing ?to=<email>' });
  }

  const name = (params.name || '').trim();
  const firstName = name ? name.split(/\s+/)[0] : '';

  try {
    const result = await sendWelcomeEmail({ email: to, name, firstName });
    return json(200, { ok: true, sentTo: to, brevo: result });
  } catch (err) {
    // Surface the Brevo error text so sender/domain issues are easy to diagnose.
    return json(502, { ok: false, error: err.message });
  }
};

function json(statusCode, obj) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  };
}
