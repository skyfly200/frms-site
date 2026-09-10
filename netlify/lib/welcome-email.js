// Shared welcome-email logic used by both the PayPal webhook and the test
// endpoint, so the two can never drift. Sends via Brevo's transactional API.
//
// Environment variables:
//   BREVO_API_KEY    (required) Brevo transactional API key
//   FROM_EMAIL       (required) a verified Brevo sender, e.g. welcome@frontrangemycosociety.org
//   FROM_NAME        (optional) sender display name
//   REPLY_TO_EMAIL   (optional) reply-to address (defaults to FROM_EMAIL)
//   WELCOME_CC       (optional) comma-separated address(es) to CC (visible to the member)
//   WELCOME_BCC      (optional) comma-separated address(es) to BCC (hidden from the member)
//   SITE_URL         (optional) base URL for email images (default https://frontrangemycosociety.org)
//   EVENTBRITE_ORG_URL (optional) organizer page the "Upcoming Events" button links to

const SITE_URL = (process.env.SITE_URL || 'https://frontrangemycosociety.org').replace(/\/+$/, '');
const EVENTBRITE_ORG_URL =
  process.env.EVENTBRITE_ORG_URL ||
  'https://www.eventbrite.com/o/front-range-mycological-society-120736224622';
const img = (file) => `${SITE_URL}/images/${file}`;

async function sendWelcomeEmail(recipient) {
  const apiKey = process.env.BREVO_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  const fromName = process.env.FROM_NAME || 'Front Range Mycological Society';
  const replyTo = process.env.REPLY_TO_EMAIL || fromEmail;
  if (!apiKey) throw new Error('Missing BREVO_API_KEY');
  if (!fromEmail) throw new Error('Missing FROM_EMAIL');
  if (!recipient || !recipient.email) throw new Error('Missing recipient email');

  const firstName = recipient.firstName || 'friend';

  // Copy a self-address on every welcome email: WELCOME_CC is visible to the
  // member, WELCOME_BCC is hidden. Either or both may be set (comma-separated).
  const parseList = (v) =>
    (v || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((email) => ({ email }));
  const cc = parseList(process.env.WELCOME_CC);
  const bcc = parseList(process.env.WELCOME_BCC);

  const payload = {
    sender: { email: fromEmail, name: fromName },
    to: [{ email: recipient.email, name: recipient.name || undefined }],
    replyTo: { email: replyTo, name: fromName },
    subject: 'Welcome to the Front Range Mycological Society! 🍄',
    htmlContent: welcomeHtml(firstName),
    textContent: welcomeText(firstName),
  };
  if (cc.length) payload.cc = cc;
  if (bcc.length) payload.bcc = bcc;

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Brevo send failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function welcomeHtml(firstName) {
  const safeName = escapeHtml(firstName);
  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background-color:#fffbeb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <div style="max-width:600px;margin:0 auto;padding:24px;">
    <!-- Header with logo -->
    <div style="background-color:#166534;color:#ffffff;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
      <img src="${img('logo.png')}" width="72" height="72" alt="Front Range Mycological Society logo" style="display:block;margin:0 auto 12px;width:72px;height:72px;border-radius:50%;">
      <h1 style="margin:0;font-size:24px;">Welcome to FRMS! 🍄</h1>
    </div>

    <!-- Hero photo -->
    <img src="${img('foray-meetup.jpg')}" alt="FRMS members on a foray" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;">

    <!-- Body -->
    <div style="background-color:#ffffff;padding:28px 24px;border:1px solid #dcfce7;border-top:none;">
      <p style="font-size:16px;line-height:1.6;margin-top:0;">Hi ${safeName},</p>
      <p style="font-size:16px;line-height:1.6;">Welcome to the <strong>Front Range Mycological Society</strong>, and thank you for becoming a member. We're genuinely delighted to have you with us. By joining, you've become part of a growing community of foragers, naturalists, scientists, and the simply curious who share a deep fascination with fungi and the wild places of Colorado's Front Range.</p>
      <p style="font-size:16px;line-height:1.6;">Your membership helps us host guided forays, educational talks, and hands-on workshops, and it supports our work in conservation and community science across the region. Whether you're identifying your very first mushroom or have spent years in the field, you'll find a welcoming place here to learn, share, and explore alongside fellow enthusiasts.</p>
      <p style="font-size:16px;line-height:1.6;">Here are a few ways to dive in and make the most of your membership:</p>
      <ul style="font-size:16px;line-height:1.7;padding-left:20px;">
        <li>Browse our <a href="${EVENTBRITE_ORG_URL}" style="color:#166534;">upcoming forays and events</a> and reserve your spot</li>
        <li>Join our <a href="https://discord.gg/mKSuJ6w9zr" style="color:#166534;">Discord community</a> to ask questions, share your finds, and connect between events</li>
        <li>Follow us on <a href="https://www.instagram.com/frontrange_mycologicalsociety" style="color:#166534;">Instagram</a> for fungi photography, identification tips, and announcements</li>
        <li>Visit <a href="${SITE_URL}" style="color:#166534;">our website</a> to learn more about the society and what's ahead</li>
      </ul>

      <!-- Eventbrite events button -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
        <tr>
          <td style="border-radius:9999px;background-color:#d97706;">
            <a href="${EVENTBRITE_ORG_URL}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;border-radius:9999px;">See Upcoming Events &amp; Get Tickets</a>
          </td>
        </tr>
      </table>

      <p style="font-size:16px;line-height:1.6;">If you ever have a question, an idea, or just want to say hello, simply reply to this email. We read every message and would love to hear what drew you to the world of fungi.</p>
      <p style="font-size:16px;line-height:1.6;">We can't wait to see you out on the trail. Until then, keep looking down.</p>
      <p style="font-size:16px;line-height:1.6;margin-bottom:0;">Warmly,<br>The Front Range Mycological Society</p>
    </div>

    <!-- Photo row -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr>
        <td width="33.33%" style="padding:0;"><img src="${img('mushroom-chanterelles.jpg')}" alt="Chanterelles" width="200" style="display:block;width:100%;height:130px;object-fit:cover;border:0;"></td>
        <td width="33.33%" style="padding:0;"><img src="${img('mushroom-oyster-pink.jpg')}" alt="Pink oyster mushrooms" width="200" style="display:block;width:100%;height:130px;object-fit:cover;border:0;"></td>
        <td width="33.33%" style="padding:0;"><img src="${img('mushroom-porcini.jpg')}" alt="Porcini mushroom" width="200" style="display:block;width:100%;height:130px;object-fit:cover;border:0;"></td>
      </tr>
    </table>

    <p style="text-align:center;color:#6b7280;font-size:12px;margin-top:16px;">Front Range Mycological Society &bull; Ward, Colorado &bull; A nonprofit organization (EIN 39-4447386)</p>
  </div>
</body>
</html>`;
}

function welcomeText(firstName) {
  return `Hi ${firstName},

Welcome to the Front Range Mycological Society, and thank you for becoming a member. We're genuinely delighted to have you with us. By joining, you've become part of a growing community of foragers, naturalists, scientists, and the simply curious who share a deep fascination with fungi and the wild places of Colorado's Front Range.

Your membership helps us host guided forays, educational talks, and hands-on workshops, and it supports our work in conservation and community science across the region. Whether you're identifying your very first mushroom or have spent years in the field, you'll find a welcoming place here to learn, share, and explore alongside fellow enthusiasts.

Here are a few ways to dive in and make the most of your membership:

- Browse our upcoming forays and events and reserve your spot: ${EVENTBRITE_ORG_URL}
- Join our Discord community to ask questions and share your finds: https://discord.gg/mKSuJ6w9zr
- Follow us on Instagram for fungi photography and tips: https://www.instagram.com/frontrange_mycologicalsociety
- Visit our website to learn more about the society: ${SITE_URL}

If you ever have a question, an idea, or just want to say hello, simply reply to this email. We read every message and would love to hear what drew you to the world of fungi.

We can't wait to see you out on the trail. Until then, keep looking down.

Warmly,
The Front Range Mycological Society

Front Range Mycological Society, Ward, Colorado. A nonprofit organization (EIN 39-4447386)`;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { sendWelcomeEmail, welcomeHtml, welcomeText };
