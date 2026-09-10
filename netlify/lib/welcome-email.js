// Shared welcome-email logic used by both the PayPal webhook and the test
// endpoint, so the two can never drift. Sends via Brevo's transactional API.
//
// Environment variables:
//   BREVO_API_KEY    (required) Brevo transactional API key
//   FROM_EMAIL       (required) a verified Brevo sender, e.g. welcome@frontrangemycosociety.org
//   FROM_NAME        (optional) sender display name
//   REPLY_TO_EMAIL   (optional) reply-to address (defaults to FROM_EMAIL)

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
    <div style="background-color:#166534;color:#ffffff;padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="margin:0;font-size:24px;">Welcome to FRMS! 🍄</h1>
    </div>
    <div style="background-color:#ffffff;padding:28px 24px;border-radius:0 0 12px 12px;border:1px solid #dcfce7;border-top:none;">
      <p style="font-size:16px;line-height:1.6;">Hi ${safeName},</p>
      <p style="font-size:16px;line-height:1.6;">Thank you for joining the <strong>Front Range Mycological Society</strong>! We're thrilled to have you as part of our community of fungi enthusiasts across Colorado's Front Range.</p>
      <p style="font-size:16px;line-height:1.6;">As a member, you'll be part of our forays, educational talks, and community events. Here's how to get connected:</p>
      <ul style="font-size:16px;line-height:1.7;padding-left:20px;">
        <li>Join our <a href="https://discord.gg/mKSuJ6w9zr" style="color:#166534;">Discord community</a> to chat, share finds, and hear about upcoming events</li>
        <li>Follow us on <a href="https://www.instagram.com/frontrange_mycologicalsociety" style="color:#166534;">Instagram</a> for fungi photos and announcements</li>
        <li>Check <a href="https://frontrangemycosociety.org" style="color:#166534;">our website</a> for upcoming forays and talks</li>
      </ul>
      <p style="font-size:16px;line-height:1.6;">If you have any questions, just reply to this email — we'd love to hear from you.</p>
      <p style="font-size:16px;line-height:1.6;">See you in the field!</p>
      <p style="font-size:16px;line-height:1.6;margin-bottom:0;">— The FRMS Team</p>
    </div>
    <p style="text-align:center;color:#6b7280;font-size:12px;margin-top:16px;">Front Range Mycological Society &bull; Ward, Colorado &bull; A nonprofit organization (EIN 39-4447386)</p>
  </div>
</body>
</html>`;
}

function welcomeText(firstName) {
  return `Hi ${firstName},

Thank you for joining the Front Range Mycological Society! We're thrilled to have you as part of our community of fungi enthusiasts across Colorado's Front Range.

As a member, you'll be part of our forays, educational talks, and community events. Here's how to get connected:

- Join our Discord community: https://discord.gg/mKSuJ6w9zr
- Follow us on Instagram: https://www.instagram.com/frontrange_mycologicalsociety
- Visit our website: https://frontrangemycosociety.org

If you have any questions, just reply to this email.

See you in the field!
- The FRMS Team

Front Range Mycological Society - Ward, Colorado - A nonprofit organization (EIN 39-4447386)`;
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
