// Netlify Function: PayPal webhook -> welcome email for new members (via Brevo)
//
// Flow:
//   1. PayPal POSTs a webhook event here when a payment completes.
//   2. We verify the event's signature with PayPal (so only genuine events act).
//   3. On PAYMENT.CAPTURE.COMPLETED we resolve the payer's name + email
//      (fetching the order from PayPal when the capture event omits them).
//   4. We send a branded welcome email through Brevo's transactional API.
//
// Required environment variables (set in Netlify > Site settings > Environment):
//   PAYPAL_CLIENT_ID       - PayPal REST app client id
//   PAYPAL_CLIENT_SECRET   - PayPal REST app secret
//   PAYPAL_WEBHOOK_ID      - id of the webhook you created in the PayPal dashboard
//   BREVO_API_KEY          - Brevo (Sendinblue) transactional API key
//   FROM_EMAIL             - verified Brevo sender, e.g. hello@yourdomain.org
// Optional:
//   FROM_NAME              - sender display name (default: Front Range Mycological Society)
//   REPLY_TO_EMAIL         - reply-to address (default: FROM_EMAIL)
//   PAYPAL_API_BASE        - https://api-m.paypal.com (live, default) or
//                            https://api-m.sandbox.paypal.com (sandbox)
//   MEMBERSHIP_KEYWORD     - if set, only send when the purchase's item name /
//                            description / custom_id contains this text
//                            (case-insensitive). Use it so donations don't get a
//                            "welcome new member" email. See README.

const { sendWelcomeEmail } = require('../lib/welcome-email');

const PAYPAL_API_BASE = process.env.PAYPAL_API_BASE || 'https://api-m.paypal.com';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let webhookEvent;
  try {
    webhookEvent = JSON.parse(event.body || '{}');
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON body' };
  }

  const eventType = webhookEvent.event_type;

  // Act on a single event type so one purchase can't trigger multiple emails.
  if (eventType !== 'PAYMENT.CAPTURE.COMPLETED') {
    // 200 so PayPal marks it delivered and stops retrying.
    return { statusCode: 200, body: `Ignored event type: ${eventType || 'unknown'}` };
  }

  let accessToken;
  try {
    accessToken = await getPayPalAccessToken();
  } catch (err) {
    console.error('Could not obtain PayPal access token:', err.message);
    return { statusCode: 500, body: 'Auth error' };
  }

  // Verify the event really came from PayPal before trusting it.
  try {
    const verified = await verifyWebhookSignature(event.headers, webhookEvent, accessToken);
    if (!verified) {
      console.error('PayPal webhook signature verification returned non-SUCCESS');
      return { statusCode: 401, body: 'Signature verification failed' };
    }
  } catch (err) {
    console.error('Error verifying webhook signature:', err.message);
    return { statusCode: 500, body: 'Verification error' };
  }

  // Resolve payer name + email (may require fetching the order).
  let payer;
  try {
    payer = await resolvePayer(webhookEvent.resource, accessToken);
  } catch (err) {
    console.error('Error resolving payer details:', err.message);
    // Acknowledge so PayPal doesn't retry a lookup that will keep failing.
    return { statusCode: 200, body: 'Payer lookup failed; acknowledged' };
  }

  if (!payer || !payer.email) {
    console.warn('No payer email on event; skipping. Capture id:', webhookEvent.resource && webhookEvent.resource.id);
    return { statusCode: 200, body: 'No payer email; acknowledged' };
  }

  // Log the purchase descriptors so MEMBERSHIP_KEYWORD can be set precisely
  // (this is how you learn what the membership button's item is named).
  console.log('Completed purchase descriptors:', JSON.stringify(purchaseDescriptors(payer)));

  // Optional: only welcome membership purchases, not donations.
  const keyword = (process.env.MEMBERSHIP_KEYWORD || '').trim().toLowerCase();
  if (keyword && !purchaseMatchesKeyword(payer, keyword)) {
    console.log(`Purchase did not match MEMBERSHIP_KEYWORD "${keyword}"; no welcome email sent.`);
    return { statusCode: 200, body: 'Not a membership purchase; acknowledged' };
  }

  try {
    await sendWelcomeEmail(payer);
  } catch (err) {
    console.error('Error sending welcome email:', err.message);
    // 500 -> PayPal will retry delivery so we get another chance to send.
    return { statusCode: 500, body: 'Failed to send welcome email' };
  }

  console.log(`Welcome email sent to ${payer.email}`);
  return { statusCode: 200, body: 'Welcome email sent' };
};

// --- PayPal helpers -------------------------------------------------------

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new Error('Missing PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET');
  }
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  const res = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) {
    throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.access_token;
}

async function verifyWebhookSignature(headers, webhookEvent, accessToken) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) throw new Error('Missing PAYPAL_WEBHOOK_ID');

  // Netlify lowercases header names; read defensively either way.
  const get = (name) => headers[name] || headers[name.toLowerCase()];

  const payload = {
    auth_algo: get('paypal-auth-algo'),
    cert_url: get('paypal-cert-url'),
    transmission_id: get('paypal-transmission-id'),
    transmission_sig: get('paypal-transmission-sig'),
    transmission_time: get('paypal-transmission-time'),
    webhook_id: webhookId,
    webhook_event: webhookEvent,
  };

  const res = await fetch(`${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`verify-webhook-signature failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  return data.verification_status === 'SUCCESS';
}

async function getOrder(orderId, accessToken) {
  const res = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    console.warn(`Could not fetch order ${orderId}: ${res.status}`);
    return null;
  }
  return res.json();
}

// Pull { email, firstName, name } out of a PayPal payer object (v1 or v2 shapes).
function extractPayer(payerObj) {
  if (!payerObj) return null;
  const info = payerObj.payer_info || {};
  const name = payerObj.name || {};
  const email = payerObj.email_address || info.email || null;
  const firstName = name.given_name || info.first_name || '';
  const surname = name.surname || info.last_name || '';
  const fullName = `${firstName} ${surname}`.trim();
  return { email, firstName, name: fullName };
}

async function resolvePayer(resource, accessToken) {
  if (!resource) return null;

  // Some capture events include the payer directly.
  const direct = extractPayer(resource.payer);
  if (direct && direct.email) {
    return { ...direct, resource };
  }

  // Otherwise look the order up to get payer details.
  const orderId =
    resource.supplementary_data &&
    resource.supplementary_data.related_ids &&
    resource.supplementary_data.related_ids.order_id;

  if (orderId) {
    const order = await getOrder(orderId, accessToken);
    if (order) {
      const fromOrder = extractPayer(order.payer) || {};
      return { ...fromOrder, order, resource };
    }
  }

  return direct; // may be null / lack an email
}

// Gather the purchase's item name / description / id fields as an array, so we
// can both log them (to discover what to match) and test a keyword against them.
function purchaseDescriptors(payer) {
  const parts = [];
  const order = payer.order;
  if (order && Array.isArray(order.purchase_units)) {
    for (const pu of order.purchase_units) {
      if (pu.description) parts.push(pu.description);
      if (pu.custom_id) parts.push(pu.custom_id);
      if (pu.invoice_id) parts.push(pu.invoice_id);
      if (pu.soft_descriptor) parts.push(pu.soft_descriptor);
      if (Array.isArray(pu.items)) {
        for (const item of pu.items) {
          if (item.name) parts.push(item.name);
          if (item.description) parts.push(item.description);
        }
      }
    }
  }
  const resource = payer.resource;
  if (resource) {
    if (resource.soft_descriptor) parts.push(resource.soft_descriptor);
    if (resource.custom_id) parts.push(resource.custom_id);
    if (resource.invoice_id) parts.push(resource.invoice_id);
  }
  return parts;
}

// Check the purchase's item/description fields against a membership keyword.
function purchaseMatchesKeyword(payer, keyword) {
  return purchaseDescriptors(payer).join(' | ').toLowerCase().includes(keyword);
}

