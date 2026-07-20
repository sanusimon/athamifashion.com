import nodemailer from "nodemailer";
import { ReviewRequest } from "@/types/review";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";

export async function sendReviewRequestEmail(request: ReviewRequest) {
  const reviewUrl = `${appUrl}/reviews/submit?token=${request.token}`;
  const fromEmail = process.env.EMAIL_FROM || "no-reply@athamifashion.com";

  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`Review email ready to send to ${request.customerEmail}: ${reviewUrl}`);
    return { success: true, fallback: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    from: fromEmail,
    to: request.customerEmail,
    subject: "Please review your recent AthamiFashion purchase",
    html: `
      <p>Hi,</p>
      <p>Thank you for your order. Your item was delivered on ${new Date(request.deliveryDate).toLocaleDateString()}.</p>
      <p>Please take a moment to share your feedback by clicking the button below.</p>
      <p><a href="${reviewUrl}" target="_blank" rel="noopener noreferrer">Review your purchase</a></p>
      <p>We appreciate your honest review.</p>
    `,
  };

  const info = await transporter.sendMail(message);
  return { success: true, info };
}
