import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to AccessGate',
      html: `
        <h2>Welcome to AccessGate, ${name}!</h2>
        <p>Your admin account has been created successfully.</p>
        <p>You can now manage events and tickets from your dashboard.</p>
      `,
    });
  } catch (error) {
    console.error('Email send error:', error);
  }
}

export async function sendTicketEmail(
  email: string,
  attendeeName: string,
  eventName: string,
  ticketCode: string,
  qrCode: string
) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Your Ticket for ${eventName}`,
      html: `
        <h2>Your Ticket is Ready!</h2>
        <p>Hi ${attendeeName},</p>
        <p>Here is your ticket for <strong>${eventName}</strong></p>
        <p><strong>Ticket Code:</strong> ${ticketCode}</p>
        <img src="cid:qrcode" alt="QR Code" style="width: 200px; height: 200px;" />
        <p>Present this QR code at the event entrance.</p>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          content: Buffer.from(qrCode.split(',')[1], 'base64'),
          cid: 'qrcode',
        },
      ],
    });
  } catch (error) {
    console.error('Email send error:', error);
  }
}

export async function sendEventReminderEmail(email: string, eventName: string, eventDate: string) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Reminder: ${eventName} is coming up!`,
      html: `
        <h2>Event Reminder</h2>
        <p>Don't forget! <strong>${eventName}</strong> is on <strong>${eventDate}</strong></p>
        <p>See you there!</p>
      `,
    });
  } catch (error) {
    console.error('Email send error:', error);
  }
}
