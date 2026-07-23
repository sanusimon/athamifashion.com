import { getReviewRequestByToken } from '@/lib/reviewService';

const appUrl =
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://athamifashion.com";

export default async function EmailPreview({ searchParams }) {
  const token = searchParams?.token;
  let request = null;

  if (token) {
    try {
      request = await getReviewRequestByToken(token);
    } catch (err) {
      request = null;
    }
  }

  // Fallback sample
  if (!request) {
    const now = new Date();
    request = {
      id: 'sample-request',
      orderId: 'ORDER123',
      productId: 'PROD-ABC',
      customerId: 'CUST-1',
      customerEmail: 'customer@example.com',
      deliveryDate: now.toISOString(),
      token: token || 'SAMPLE_TOKEN',
      status: 'pending',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
  }

  const reviewUrl = `${appUrl}/reviews/submit?token=${request.token}`;

  return (
    <html>
      <head>
        <title>Email preview</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <style>{`body{font-family:Inter,system-ui,Arial,Helvetica,sans-serif;padding:24px;color:#111}`}</style>
      </head>
      <body>
        <div style={{maxWidth:680}}>
          <h2>Review Request Email Preview</h2>
          <p>
            To: <strong>{request.customerEmail}</strong>
          </p>
          <p>Order ID: {request.orderId}</p>
          <p>Delivered on: {new Date(request.deliveryDate).toLocaleDateString()}</p>

          <div style={{marginTop:20,padding:20,background:'#fff',border:'1px solid #eee',borderRadius:8}}>
            <p>Hi,</p>
            <p>
              Thank you for your order. Your item was delivered on{' '}
              {new Date(request.deliveryDate).toLocaleDateString()}.
            </p>
            <p>Please take a moment to share your feedback by clicking the button below.</p>
            <p>
              <a href={reviewUrl} target="_blank" rel="noreferrer" style={{display:'inline-block',padding:'12px 18px',background:'#111827',color:'#fff',borderRadius:6,textDecoration:'none'}}>Review your purchase</a>
            </p>
            <p style={{color:'#6b7280'}}>If this is a test preview, no email has been sent.</p>
          </div>

          <div style={{marginTop:16}}>
            <p>Direct review link:</p>
            <pre style={{background:'#f3f4f6',padding:12,borderRadius:6,overflowX:'auto'}}>{reviewUrl}</pre>
          </div>
        </div>
      </body>
    </html>
  );
}
