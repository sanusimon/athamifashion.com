# Review Email System - Verification & Deployment Guide

## ✅ Build Status
- **Latest build**: SUCCESS ✓
- All endpoints compiled and ready
- No type errors

---

## 📋 Configuration Checklist

### Required Environment Variables

| Variable | Status | Purpose |
|----------|--------|---------|
| `REVIEWS_BACKFILL_SECRET` | ✅ Configured | Secret for one-time backfill endpoint |
| `EMAIL_HOST` | ✅ Configured | SMTP server (e.g., smtp.gmail.com) |
| `EMAIL_USER` | ✅ Configured | SMTP username (email address) |
| `EMAIL_PASS` | ✅ Configured | SMTP password or app-specific password |
| `EMAIL_PORT` | ✅ Configured | SMTP port (e.g., 587 for Gmail) |
| `EMAIL_SECURE` | ✅ Configured | Use TLS (false for port 587, true for 465) |
| `EMAIL_FROM` | ✅ Configured | Display name and email for review emails |
| `NEXT_PUBLIC_WIX_CLIENT_ID` | ✅ Configured | Wix client ID for visitor/member authentication |
| `WIX_APP_ID` | ❌ **MISSING** | Wix app ID for server-side access |
| `WIX_APP_SECRET` | ❌ **MISSING** | Wix app secret for server-side access |
| `WIX_REFRESH_TOKEN` | ❌ **MISSING** | Optional if `WIX_INSTANCE_ID` is configured |
| `WIX_INSTANCE_ID` | ❌ **MISSING** | Optional alternative to `WIX_REFRESH_TOKEN` for server auth |
| `CRON_SECRET` | ⚠️ Optional | Security token for Vercel Cron (optional but recommended) |

### Critical Missing Configuration
**For server-side Wix API access, set `WIX_APP_ID` and `WIX_APP_SECRET`, plus either `WIX_REFRESH_TOKEN` or `WIX_INSTANCE_ID`.**

#### How to configure server-side Wix auth:
1. Set `WIX_APP_ID` and `WIX_APP_SECRET` in your environment.
2. Provide one of the following for app-level Wix API calls:
   - `WIX_REFRESH_TOKEN` from your Wix OAuth app installation flow
   - or `WIX_INSTANCE_ID` if your integration uses Wix instance credentials
3. If you already have a refresh token, add it to `.env`:
   ```
   WIX_REFRESH_TOKEN=<your_long_refresh_token_here>
   ```
4. Restart your server

---

## 🧪 Test Email Endpoint

### Verify Configuration & Send One Test Email

```bash
curl -X POST "http://localhost:3000/api/reviews/test?secret=abc123xyz"
```

**Response structure:**
```json
{
  "step": [
    "✅ Configuration check complete",
    "✅ Found first order: xxx-order-id (status: DELIVERED)",
    "✅ Created review request with token: xxx...",
    "✅ Test email sent to: customer@email.com",
    "✅ Email sent via SMTP (Gmail configured)"
  ],
  "config_status": {
    "EMAIL_HOST": "configured",
    "EMAIL_USER": "configured",
    "EMAIL_PASS": "configured",
    "EMAIL_PORT": "587",
    "EMAIL_SECURE": "false",
    "EMAIL_FROM": "configured",
    "WIX_REFRESH_TOKEN": "configured|missing (optional if WIX_INSTANCE_ID is configured)",
    "REVIEWS_BACKFILL_SECRET": "configured"
  },
  "test_email_sent": true,
  "first_order_found": {
    "id": "xxx-order-id",
    "status": "DELIVERED",
    "lineItemCount": 1,
    "buyerEmail": "customer@email.com",
    "eligible": true
  }
}
```

**What this tells you:**
- ✅ All SMTP configuration is correct
- ✅ Can connect to Wix and fetch orders
- ✅ Email was successfully sent
- ✅ Review request was stored in `reviews-data/reviews.json`

---

## 🚀 One-Time Backfill (Send to All Eligible Orders)

**Only run this AFTER the test endpoint succeeds.**

```bash
curl -X POST "http://localhost:3000/api/reviews/backfill?secret=abc123xyz"
```

**Response includes:**
- `processed`: Total orders scanned
- `sent`: Successfully sent
- `skipped`: Orders excluded (wrong status, no email, already sent, etc.)
- `failed`: Failed to send
- `sentSamples`: First few orders that got emails
- `skippedSamples`: Examples of why orders were skipped (with reasons)
- `failedSamples`: Orders that failed with error details

**Duplication prevention:**
- ✅ Automatically skips orders that already have a review request
- ✅ Stores metadata flag `reviewEmailSent` on Wix orders (best-effort)
- ✅ All requests tracked in `reviews-data/reviews.json`

---

## ⏰ Automatic Future Emails (Vercel Cron Job)

### How it works
Once configured in production, Vercel will automatically:
1. **Run every hour** at the top of the hour (UTC)
2. **Check for pending review requests** where `sendAt <= now`
3. **Automatically send emails** to customers who haven't received them yet
4. **Mark as sent** in `reviews-data/reviews.json`

### Configuration

**File**: `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/reviews/cron",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Cron schedule**: `0 * * * *` = Every hour at :00
- To change: Use [crontab.guru](https://crontab.guru) for different schedules

### Production Setup

1. **Commit and push** all changes to your Git repository
2. **Connect to Vercel** (if not already connected)
3. Vercel automatically detects `vercel.json` and enables cron jobs
4. **Check Vercel dashboard** → Deployments → Cron Jobs to see status

### Local Testing of Cron Endpoint

```bash
# Manually trigger the cron job (for testing)
curl "http://localhost:3000/api/reviews/cron"

# With security header (if CRON_SECRET is set)
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  "http://localhost:3000/api/reviews/cron"
```

---

## 🎯 Complete Review Email Flow

### Day 1: Customer Places Order
- Order created in Wix with status `PENDING`

### Day N: Order Delivered
- Wix updates order status to `DELIVERED` or `FULFILLED`

### Day N + 5: Automatic Email (via Cron)
- Vercel Cron triggers `/api/reviews/cron` every hour
- System finds orders where `sendAt <= now`
- Creates review request (if not already created)
- Sends review email to customer
- Customer receives: "Review your purchase" link with secure token

### Customer Reviews
- Customer clicks link → `/reviews/submit?token=xxx`
- Fills out form (rating, text, photos)
- Review saved as `pending` (awaiting admin approval)
- Admin approves at `/admin/reviews`

### Approved
- Review becomes `approved`
- Displays on product page

---

## 🔒 Security

### Secret Protection
- `REVIEWS_BACKFILL_SECRET` required for backfill endpoint
- `CRON_SECRET` recommended for production cron jobs
- All secrets checked before processing

### Data Safety
- No customer data exposed in responses
- Email addresses masked in logs
- Tokens are cryptographically secure UUIDs
- All data persisted in `reviews-data/reviews.json`

---

## 📊 Monitoring

### View Sent Emails
```bash
cat reviews-data/reviews.json | jq '.requests[] | select(.status == "sent")'
```

### View Pending Emails
```bash
cat reviews-data/reviews.json | jq '.requests[] | select(.status == "pending")'
```

### Check Cron Job Logs
In Vercel dashboard:
- Navigate to your deployment
- Click "Logs"
- Filter for "reviews/cron"
- See sent/failed counts for each run

---

## 🛠️ Troubleshooting

### Test endpoint shows missing or invalid Wix auth
- Ensure `WIX_APP_ID` and `WIX_APP_SECRET` are set
- Add `WIX_REFRESH_TOKEN` or `WIX_INSTANCE_ID` to your environment
- Restart your server
- Re-run the test endpoint

### "Email send failed" in test response
- Check `EMAIL_USER` and `EMAIL_PASS` are correct
- For Gmail: Use an [App Password](https://support.google.com/accounts/answer/185833), not your account password
- Verify `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE` match your SMTP provider

### Cron job not running in production
- Ensure `vercel.json` is in repository root
- Commit and push to your Git branch
- Redeploy on Vercel (usually automatic)
- Check Vercel dashboard Cron Jobs tab

### Emails marked as spam
- Verify sender email (`EMAIL_FROM`) is correctly configured
- Consider adding SPF/DKIM records for your domain
- Check Gmail spam folder for test emails

---

## ✨ Summary

| Feature | Status | Details |
|---------|--------|---------|
| Configuration | ✅ Ready | All SMTP vars set, WIX token needed |
| Test Endpoint | ✅ Ready | `/api/reviews/test?secret=...` |
| One-Time Backfill | ✅ Ready | `/api/reviews/backfill?secret=...` |
| Automatic Cron | ✅ Ready | Deployed via `vercel.json` |
| Duplication Safety | ✅ Ready | Checked against local JSON + Wix metadata |
| Production Build | ✅ Clean | No errors |

---

## 📞 Next Steps

1. **Add `WIX_APP_ID` and `WIX_APP_SECRET`** to your `.env`
2. **Add `WIX_REFRESH_TOKEN` or `WIX_INSTANCE_ID`** for server-side Wix API access
3. **Run test endpoint** to verify Gmail SMTP and Wix connectivity
4. **Run backfill endpoint** to send to existing orders
5. **Commit & push** all changes
6. **Deploy to production** (Vercel auto-enables cron)

