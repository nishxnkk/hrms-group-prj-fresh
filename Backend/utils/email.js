import nodemailer from 'nodemailer';

// This utility will use real SMTP when configured via env vars (production),
// otherwise it falls back to Ethereal (free, in-memory SMTP for local testing).
// Env vars (recommended): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE, FROM_EMAIL

let transporterPromise;

const createTransporter = async () => {
  // If SMTP creds are provided, use them
  if (process.env.SMTP_HOST && (process.env.SMTP_USER || process.env.SMTP_PASS)) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      } : undefined
    });
  }

  // Otherwise create an Ethereal test account (free) for local testing
  const testAccount = await nodemailer.createTestAccount();
  console.log('Using Ethereal test account', testAccount.user);

  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    }
  });
};

export const sendMail = async ({ to, subject, text, html, from }) => {
  transporterPromise = transporterPromise || createTransporter();
  const transporter = await transporterPromise;

  const mailOptions = {
    from: from || process.env.FROM_EMAIL || process.env.SMTP_USER || 'no-reply@example.com',
    to,
    subject,
    text,
    html
  };

  const info = await transporter.sendMail(mailOptions);

  // If using Ethereal, a preview URL is available — log it for convenience
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) console.log('Ethereal preview URL:', preview);

  return info;
};
