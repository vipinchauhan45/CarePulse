import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.ALERT_EMAIL_USER,
    pass: process.env.ALERT_EMAIL_PASS,
  },
});

// Verify transporter on startup
transporter.verify()
  .then(() => console.log("[EMAIL] transporter verified"))
  .catch((err) => console.error("[EMAIL] transporter verification failed:", err));

export async function sendAlertEmail(
  to: string,
  subject: string,
  message: string,
  bcc?: string[]
) {
  try {
    const info = await transporter.sendMail({
      from: `"Smart Health Monitor" <${process.env.ALERT_EMAIL_USER}>`,
      to,
      bcc,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: red;">Patient Alert</h2>
          <pre style="white-space: pre-wrap;">${message}</pre>
          <p><strong>Check the patient dashboard immediately.</strong></p>
        </div>
      `,
    });

    console.log("[EMAIL] sent successfully:", info.messageId);
  } catch (err) {
    console.error("[EMAIL] send failed:", err);
    throw err;
  }
}
