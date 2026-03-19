interface BrevoCredential {
  apiKey: string;
  senderEmail: string;
}

function getBrevoCredentials(): BrevoCredential[] {
  const multi = process.env.BREVO_KEYS;
  if (multi) {
    return multi.split(',').map((entry) => {
      const [apiKey, senderEmail] = entry.trim().split(':');
      return { apiKey, senderEmail };
    });
  }
  if (process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL) {
    return [{ apiKey: process.env.BREVO_API_KEY, senderEmail: process.env.BREVO_SENDER_EMAIL }];
  }
  return [];
}

let rrIndex = 0;

async function sendWithBrevo(
  cred: BrevoCredential,
  toEmail: string,
  subject: string,
  html: string
): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': cred.apiKey,
      },
      body: JSON.stringify({
        sender: { name: process.env.BREVO_FROM_NAME || 'EduForms', email: cred.senderEmail },
        to: [{ email: toEmail }],
        subject,
        htmlContent: html,
      }),
    });

    if (res.ok) return { ok: true, status: res.status };

    const errData = await res.json().catch(() => ({}));
    const errMsg = errData?.message || errData?.code || `HTTP ${res.status}`;
    console.error(`Brevo key ...${cred.apiKey.slice(-8)} failed: ${errMsg}`);
    return { ok: false, status: res.status, error: errMsg };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network error';
    console.error(`Brevo exception: ${msg}`);
    return { ok: false, status: 0, error: msg };
  }
}

async function sendEmailWithFallback(toEmail: string, subject: string, html: string): Promise<void> {
  const creds = getBrevoCredentials();
  if (creds.length === 0) throw new Error('No Brevo API keys configured');

  const startIdx = rrIndex % creds.length;
  rrIndex++;

  for (let attempt = 0; attempt < creds.length; attempt++) {
    const idx = (startIdx + attempt) % creds.length;
    const result = await sendWithBrevo(creds[idx], toEmail, subject, html);
    if (result.ok) return;
    console.warn(`Key ${idx + 1}/${creds.length} failed (${result.status}), trying next...`);
  }

  throw new Error('All Brevo API keys exhausted. Could not send email.');
}

export async function sendOtpEmail(to: string, otp: string, formTitle: string) {
  const digits = otp.split('');
  const digitCells = digits
    .map(
      (d, i) =>
        `<td style="width:44px;height:52px;text-align:center;vertical-align:middle;font-size:26px;font-weight:800;font-family:monospace;color:#1a1a2e;background:#f0f4ff;border:2px solid #4361ee;${i < digits.length - 1 ? 'border-right:none;' : ''}">${d}</td>`
    )
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f7fa;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fa;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#1a1a2e;padding:32px 24px;text-align:center;">
            <p style="margin:0;font-size:24px;font-weight:600;color:#ffffff;">EduForms</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 24px;">
            <p style="margin:0 0 8px;color:#444;line-height:1.6;">You are requesting access to fill the form:</p>
            <p style="margin:0 0 24px;font-weight:700;color:#1a1a2e;font-size:16px;">${formTitle}</p>
            <p style="margin:0 0 16px;color:#444;">Use the following OTP to verify your identity:</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 12px;">
              <tr>${digitCells}</tr>
            </table>
            <p style="margin:0 0 24px;text-align:center;font-size:11px;color:#888;">Tap to copy: <span style="font-family:monospace;font-size:18px;font-weight:700;color:#1a1a2e;letter-spacing:6px;">${otp}</span></p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
              <tr><td style="border-top:1px solid #eee;">&nbsp;</td></tr>
            </table>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td style="padding:12px 16px;background:#fff5f5;border:1px solid #e8341a;border-left:4px solid #e8341a;">
                  <p style="margin:0;font-size:12px;font-weight:600;color:#e8341a;">This code expires in 10 minutes</p>
                </td>
              </tr>
            </table>
            <p style="margin:0;font-size:12px;color:#888;">If you did not request this, please ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;text-align:center;color:#888;font-size:12px;border-top:1px solid #eee;">
            <p style="margin:0;">&copy; EduForms. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendEmailWithFallback(to, `${otp} is your EduForms verification code`, html);
}
