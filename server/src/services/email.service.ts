import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: { filename: string; path: string }[];
}

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (process.env.NODE_ENV === 'development' && !process.env.SMTP_USER) {
    console.log('[EMAIL] Would send to:', options.to);
    console.log('[EMAIL] Subject:', options.subject);
    return;
  }

  try {
    const t = getTransporter();
    await t.sendMail({
      from: process.env.EMAIL_FROM ?? 'BAJ Services <no-reply@bajservices.com>',
      to: Array.isArray(options.to) ? options.to.join(',') : options.to,
      subject: options.subject,
      html: options.html,
      attachments: options.attachments,
    });
    console.log('[EMAIL] Sent to:', options.to, '| Subject:', options.subject);
  } catch (err) {
    console.error('[EMAIL] Failed to send:', err);
  }
}

export async function sendPaymentReminder(
  clientEmail: string,
  clientName: string,
  invoiceNumber: string,
  amount: number,
  daysLeft: number,
  deadline: Date
): Promise<void> {
  await sendEmail({
    to: clientEmail,
    subject: `Payment Reminder — Invoice #${invoiceNumber} due in ${daysLeft} days`,
    html: `
      <p>Dear ${clientName},</p>
      <p>This is a reminder that invoice <strong>#${invoiceNumber}</strong> for 
         <strong>${amount.toLocaleString()} XAF</strong> is due on 
         <strong>${deadline.toLocaleDateString('en-GB')}</strong> (in ${daysLeft} days).</p>
      <p>Please arrange payment at your earliest convenience.</p>
      <p>Payment methods: Virement bancaire or Chèque.</p>
      <br/>
      <p>Best regards,<br/>BAJ Services</p>
    `,
  });
}
