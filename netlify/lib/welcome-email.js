// Shared welcome-email logic used by both the PayPal webhook and the test
// endpoint, so the two can never drift. Sends via Brevo's transactional API.
//
// Environment variables:
//   BREVO_API_KEY    (required) Brevo transactional API key
//   FROM_EMAIL       (required) a verified Brevo sender, e.g. welcome@frontrangemycosociety.org
//   FROM_NAME        (optional) sender display name
//   REPLY_TO_EMAIL   (optional) reply-to address (defaults to FROM_EMAIL)
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

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: fromEmail, name: fromName },
      to: [{ email: recipient.email, name: recipient.name || undefined }],
      replyTo: { email: replyTo, name: fromName },
      subject: 'Welcome to the Front Range Mycological Society! 🍄',
      htmlContent: welcomeHtml(firstName),
      textContent: welcomeText(firstName),
    }),
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
      <p style="font-size:16px;line-height:1.6;">Thank you for joining the <strong>Front Range Mycological Society</strong>! We're thrilled to have you as part of our community of fungi enthusiasts across Colorado's Front Range.</p>
      <p style="font-size:16px;line-height:1.6;">As a member, you'll be part of our forays, educational talks, and community events. Here's how to get connected:</p>
      <ul style="font-size:16px;line-height:1.7;padding-left:20px;">
        <li>Join our <a href="https://discord.gg/mKSuJ6w9zr" style="color:#166534;">Discord community</a> to chat, share finds, and hear about upcoming events</li>
        <li>Follow us on <a href="https://www.instagram.com/frontrange_mycologicalsociety" style="color:#166534;">Instagram</a> for fungi photos and announcements</li>
        <li>Check <a href="${SITE_URL}" style="color:#166534;">our website</a> for upcoming forays and talks</li>
      </ul>

      <!-- Eventbrite events button -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto;">
        <tr>
          <td style="border-radius:9999px;background-color:#d97706;">
            <a href="${EVENTBRITE_ORG_URL}" style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;border-radius:9999px;">See Upcoming Events &amp; Get Tickets</a>
          </td>
        </tr>
      </table>

      <p style="font-size:16px;line-height:1.6;">If you have any questions, just reply to this email. We'd love to hear from you.</p>
      <p style="font-size:16px;line-height:1.6;">See you in the field!</p>
      <p style="font-size:16px;line-height:1.6;margin-bottom:0;">The FRMS Team</p>
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

Thank you for joining the Front Range Mycological Society! We're thrilled to have you as part of our community of fungi enthusiasts across Colorado's Front Range.

As a member, you'll be part of our forays, educational talks, and community events. Here's how to get connected:

- See upcoming events and get tickets: ${EVENTBRITE_ORG_URL}
- Join our Discord community: https://discord.gg/mKSuJ6w9zr
- Follow us on Instagram: https://www.instagram.com/frontrange_mycologicalsociety
- Visit our website: ${SITE_URL}

If you have any questions, just reply to this email. We'd love to hear from you.

See you in the field!
The FRMS Team

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
