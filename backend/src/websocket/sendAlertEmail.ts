import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export const sendAlertEmail = async (
  to: string,
  subject: string,
  message: string
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.ALERT_EMAIL_USER,
        pass: process.env.ALERT_EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Smart Health Monitor" <${process.env.ALERT_EMAIL_USER}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: red;">Patient Alert</h2>
          <p>${message}</p>
          <p><strong>Check the patient dashboard immediately.</strong></p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Alert email sent to ${to}`);
  } catch (error) {
    console.error(" Error sending alert email:", error);
  }
};
