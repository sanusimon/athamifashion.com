import nodemailer from "nodemailer";
import wixClientServer from "@/lib/wixClientServer";
import { ReviewRequest } from "@/types/review";

const appUrl =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://athamifashion.com";

console.log("Email APP_URL:", appUrl);

export async function sendReviewRequestEmail(
  requests: ReviewRequest[]
) {
  if (!requests.length) {
    return {
      success: false,
      error: "No review requests supplied.",
    };
  }

  const reviewUrl = (token: string) =>
    `${appUrl}/reviews/submit?token=${token}`;

  const fromEmail =
    process.env.EMAIL_FROM ||
    "no-reply@athamifashion.com";

  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASS
  ) {
    console.log(
      `Review email ready for ${requests[0].customerEmail}`
    );

    return {
      success: true,
      fallback: true,
    };
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

  const wixClient = await wixClientServer();

  const productsHtml: string[] = [];

  for (const request of requests) {
    try {
      const response = await wixClient.products.getProduct(
  request.productId
);

console.log(
  "Product Response:",
  JSON.stringify(response, null, 2)
);

const product: any = response.product;

const image =
  product?.media?.mainMedia?.image?.url ||
  product?.media?.items?.[0]?.image?.url ||
  "";

const productName = product?.name || "Product";

      productsHtml.push(`
      <tr>
        <td
          style="
            border:1px solid #eeeeee;
            border-radius:12px;
            padding:20px;
          "
        >

          ${
            image
              ? `
          <img
            src="${image}"
            width="140"
            style="
              border-radius:10px;
              margin-bottom:15px;
            "
          />
          `
              : ""
          }

          <h3
            style="
              margin:0 0 20px;
              color:#222;
              font-size:20px;
            "
          >
            ${productName}
          </h3>

          <a
            href="${reviewUrl(request.token)}"
            style="
              display:inline-block;
              padding:14px 28px;
              background:#0f766e;
              color:#ffffff;
              text-decoration:none;
              border-radius:8px;
              font-weight:bold;
            "
          >
            ⭐ Review this Product
          </a>

        </td>
      </tr>

      <tr>
        <td height="25"></td>
      </tr>
      `);

    } catch (err) {
      console.error(
        "Unable to load product",
        request.productId,
        err
      );
    }
  }

  const productCards = productsHtml.join("");
    const message = {
    from: `"AthamiFashion" <${fromEmail}>`,
    to: requests[0].customerEmail,
    subject: "Please review your recent AthamiFashion purchase",

    html: `
<!DOCTYPE html>
<html>

<head>
<meta charset="UTF-8" />
</head>

<body
style="
margin:0;
padding:30px;
background:#f5f5f5;
font-family:Arial,sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">

<table
width="600"
cellpadding="0"
cellspacing="0"
style="
background:#ffffff;
border-radius:14px;
padding:40px;
">

<tr>
<td align="center">

<img
src="${appUrl}/Athamifashion-logo.svg"
width="170"
alt="AthamiFashion"
style="margin-bottom:30px;"
/>

<h2
style="
margin:0;
color:#222;
"
>
Thank you for your purchase ❤️
</h2>

<p
style="
font-size:16px;
color:#555;
line-height:28px;
margin-top:20px;
"
>
Hi,
</p>

<p
style="
font-size:16px;
color:#555;
line-height:28px;
"
>
Your order was delivered on

<b>
${new Date(requests[0].deliveryDate).toLocaleDateString()}
</b>

</p>

<p
style="
font-size:16px;
color:#555;
line-height:28px;
margin-bottom:35px;
"
>
We'd love to hear your feedback.

Please review each product below.
</p>

${productCards}

<hr
style="
margin:35px 0;
border:none;
border-top:1px solid #eeeeee;
"
/>

<p
style="
font-size:13px;
color:#888;
line-height:22px;
"
>
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