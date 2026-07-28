import nodemailer from "nodemailer";
import { ReviewRequest } from "@/types/review";

//const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";
const appUrl =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://athamifashion.com";
  console.log("Email APP_URL:", appUrl);
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
  from: `"AthamiFashion" <${fromEmail}>`,
  to: request.customerEmail,
  subject: "Please review your recent AthamiFashion purchase",
  html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
</head>
<body style="margin:0;padding:30px;background:#f5f5f5;font-family:Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0"
style="background:#ffffff;border-radius:12px;padding:40px;">

<tr>
<td align="center">

<img
src="${appUrl}/Athamifashion-logo.svg"
width="170"
alt="AthamiFashion"
style="margin-bottom:25px;" />

<h2 style="margin:0;color:#222;">
Thank you for your purchase ❤️
</h2>

<p style="font-size:16px;color:#555;line-height:28px;">
Hi,
</p>

<p style="font-size:16px;color:#555;line-height:28px;">
Your order was delivered on
<b>${new Date(request.deliveryDate).toLocaleDateString()}</b>.
</p>

<p style="font-size:16px;color:#555;line-height:28px;">
We would love to hear your feedback.
</p>

<table cellpadding="0" cellspacing="0" style="margin:35px 0;">
<tr>
<td bgcolor="#0f766e" style="border-radius:8px;">
<a
href="${reviewUrl}"
style="
display:inline-block;
padding:15px 35px;
font-size:16px;
font-weight:bold;
color:#ffffff;
text-decoration:none;
">
⭐ Review Your Purchase
</a>
</td>
</tr>
</table>

<p style="font-size:14px;color:#888;">
If the button doesn't work, copy and paste this link:
</p>

<p style="word-break:break-all;">
<a href="${reviewUrl}">
${reviewUrl}
</a>
</p>

<hr style="margin:35px 0;border:none;border-top:1px solid #eee;" />

<p style="font-size:13px;color:#888;">
AthamiFashion<br/>
Thank you for shopping with us.
</p>

</td>
</tr>
</table>

</td>
</tr>
</table>

</body>
</html>
`,
};

  try {
  await transporter.verify();
  console.log("SMTP connection successful");

  const info = await transporter.sendMail(message);

  console.log("Email sent:", info.messageId);

  return {
    success: true,
    info,
  };
} catch (err) {
  if (err instanceof Error) {
  console.error("SMTP Error:", err.message);
  console.error(err.stack);
} else {
  console.error("SMTP Error:", err);
}

  return {
    success: false,
    error: err,
  };
}
}
