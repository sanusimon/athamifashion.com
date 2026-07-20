# Review System Guide: Email Sending History & Review History

## Overview
Your project stores review data in a JSON file at the root directory: `reviews-data/reviews.json`

The review system tracks two main things:
1. **Review Requests** - emails sent to customers asking them to review products
2. **Reviews** - actual reviews submitted by customers (pending approval)

---

## 📂 Where Review Data is Stored

### File Location
```
/Volumes/My files/athami-fashion/reviews-data/reviews.json
```

### File Structure
```json
{
  "reviews": [
    {
      "id": "unique-review-id",
      "requestId": "link-to-request",
      "orderId": "wix-order-id",
      "productId": "wix-product-id",
      "customerId": "customer-contact-id",
      "customerEmail": "customer@email.com",
      "rating": 4,
      "text": "Great product!",
      "photos": ["url1", "url2"],
      "status": "pending|approved|rejected",
      "submittedAt": "2026-07-20T10:30:00.000Z",
      "approvedAt": "2026-07-20T11:00:00.000Z",
      "createdAt": "2026-07-20T10:30:00.000Z",
      "updatedAt": "2026-07-20T11:00:00.000Z"
    }
  ],
  "requests": [
    {
      "id": "unique-request-id",
      "orderId": "wix-order-id",
      "productId": "wix-product-id",
      "customerId": "customer-contact-id",
      "customerEmail": "customer@email.com",
      "deliveryDate": "2026-07-15T00:00:00.000Z",
      "sendAt": "2026-07-20T00:00:00.000Z",
      "token": "secure-token",
      "status": "pending|sent|reviewed|expired",
      "createdAt": "2026-07-20T08:00:00.000Z",
      "updatedAt": "2026-07-20T09:00:00.000Z"
    }
  ]
}
```

---

## 🔍 How to View Review Email Sending History

### Method 1: Using the Admin API
Query pending review requests using the REST API:

```bash
# Get all pending review requests (emails scheduled to send)
curl http://localhost:3000/api/reviews/send-pending

# Response:
{
  "sent": 2,
  "results": [
    {
      "requestId": "req-123",
      "emailResult": { "success": true, "fallback": false }
    }
  ]
}
```

### Method 2: Directly Read the JSON File
Open `reviews-data/reviews.json` with a text editor or use terminal:

```bash
# View the entire file
cat reviews-data/reviews.json | jq .requests

# View only emails sent today
cat reviews-data/reviews.json | jq '.requests[] | select(.status == "sent")'

# View emails for a specific customer
cat reviews-data/reviews.json | jq '.requests[] | select(.customerEmail == "customer@example.com")'
```

### Method 3: Admin Dashboard (Recommended)
Visit the review admin page:
```
http://localhost:3000/admin/reviews
```

This page shows:
- Email sending history with timestamps
- Customer email addresses and order details
- Email status (pending, sent, reviewed, expired)
- Filter by status or date range
- Download history as CSV

---

## 📋 How to View Given/Submitted Review History

### Method 1: Using Review Admin API

```bash
# Get all pending reviews (submitted but not approved yet)
curl http://localhost:3000/api/reviews/pending

# Response:
{
  "reviews": [
    {
      "id": "review-123",
      "productId": "prod-abc",
      "customerId": "cust-1",
      "customerEmail": "reviewer@example.com",
      "rating": 5,
      "text": "Excellent quality!",
      "photos": ["url"],
      "status": "pending",
      "submittedAt": "2026-07-20T14:30:00.000Z",
      "createdAt": "2026-07-20T14:30:00.000Z",
      "updatedAt": "2026-07-20T14:30:00.000Z"
    }
  ]
}
```

```bash
# Get approved reviews for a specific product
curl http://localhost:3000/api/reviews/product/PRODUCT_ID

# Response:
{
  "productId": "prod-abc",
  "averageRating": 4.5,
  "reviewCount": 8,
  "reviews": [
    { "id": "...", "rating": 5, "text": "...", ... },
    { "id": "...", "rating": 4, "text": "...", ... }
  ]
}
```

### Method 2: Directly Query the JSON File

```bash
# View all reviews (submitted)
cat reviews-data/reviews.json | jq .reviews

# View pending reviews (not yet approved)
cat reviews-data/reviews.json | jq '.reviews[] | select(.status == "pending")'

# View approved reviews
cat reviews-data/reviews.json | jq '.reviews[] | select(.status == "approved")'

# Count reviews by status
cat reviews-data/reviews.json | jq '.reviews | group_by(.status) | map({status: .[0].status, count: length})'

# Find reviews for a specific product
cat reviews-data/reviews.json | jq '.reviews[] | select(.productId == "PRODUCT_ID")'

# Find reviews from a specific customer
cat reviews-data/reviews.json | jq '.reviews[] | select(.customerEmail == "customer@example.com")'
```

### Method 3: Admin Dashboard (Recommended)
Visit the review admin page:
```
http://localhost:3000/admin/reviews
```

Tabs available:
- **Email History** - All review requests sent to customers
- **Pending Reviews** - Reviews submitted but awaiting approval
- **Approved Reviews** - Published reviews visible to customers
- **Rejected Reviews** - Reviews that were rejected

Each tab shows:
- Customer name and email
- Order ID and Product ID
- Rating and review text
- Submission date and approval date
- Action buttons (Approve, Reject, Delete)

---

## 🛠️ Programmatic Access (For Custom Scripts)

### Read Review Requests (Email History)

```typescript
import { readReviewData } from "@/lib/reviewStore";

async function getEmailSendingHistory() {
  const data = await readReviewData();
  
  // Get all sent emails
  const sentEmails = data.requests.filter(r => r.status === "sent");
  
  // Get emails sent in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentEmails = data.requests.filter(r => 
    new Date(r.sendAt) > sevenDaysAgo && r.status === "sent"
  );
  
  // Get emails by customer
  const customerEmails = (email: string) => 
    data.requests.filter(r => r.customerEmail === email);
  
  return { sentEmails, recentEmails, customerEmails };
}
```

### Read Reviews (Submitted Reviews)

```typescript
import { readReviewData } from "@/lib/reviewStore";

async function getReviewHistory() {
  const data = await readReviewData();
  
  // Get all approved reviews
  const approvedReviews = data.reviews.filter(r => r.status === "approved");
  
  // Get pending reviews
  const pendingReviews = data.reviews.filter(r => r.status === "pending");
  
  // Get reviews by product
  const productReviews = (productId: string) =>
    data.reviews.filter(r => r.productId === productId && r.status === "approved");
  
  // Get average rating for product
  const getProductRating = (productId: string) => {
    const reviews = productReviews(productId);
    if (reviews.length === 0) return 0;
    return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  };
  
  return { approvedReviews, pendingReviews, productReviews, getProductRating };
}
```

### Approve a Review

```typescript
import { approveReview } from "@/lib/reviewService";

async function approveCustomerReview(reviewId: string) {
  const review = await approveReview(reviewId);
  console.log("Review approved:", review);
}
```

---

## 📊 Key Statistics & Queries

### Total Metrics
```bash
# Total emails sent
cat reviews-data/reviews.json | jq '.requests | length'

# Total reviews submitted
cat reviews-data/reviews.json | jq '.reviews | length'

# Approved vs Pending
cat reviews-data/reviews.json | jq '.reviews | group_by(.status) | map({status: .[0].status, count: length})'
```

### Email Sending Status Breakdown
| Status | Meaning |
|--------|---------|
| `pending` | Email scheduled but not yet sent |
| `sent` | Email successfully sent to customer |
| `reviewed` | Customer submitted a review (email purpose fulfilled) |
| `expired` | Email sending deadline passed |

### Review Status Breakdown
| Status | Meaning |
|--------|---------|
| `pending` | Review submitted, awaiting admin approval |
| `approved` | Review approved and visible to customers |
| `rejected` | Review rejected by admin (customer won't see it) |

---

## 🔗 Related API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/reviews/send-pending` | POST | Trigger sending pending review request emails |
| `/api/reviews/pending` | GET | Get all pending reviews (awaiting approval) |
| `/api/reviews/product/[id]` | GET | Get approved reviews for a product |
| `/api/reviews/submit` | POST | Submit a new review (customer) |
| `/api/reviews/[id]/approve` | PATCH | Approve a pending review |
| `/api/reviews/request` | POST | Create a review request |
| `/email-preview` | GET | Preview review request email HTML |

---

## 📝 Example Scenarios

### Scenario 1: Check if customer received review email
```bash
cat reviews-data/reviews.json | jq '.requests[] | select(.customerEmail == "john@example.com")'
# Shows: sendAt date, status (sent/pending), token
```

### Scenario 2: View all reviews awaiting approval
```bash
cat reviews-data/reviews.json | jq '.reviews[] | select(.status == "pending") | {id, customerEmail, rating, text, submittedAt}'
```

### Scenario 3: Get average rating for a product
```bash
cat reviews-data/reviews.json | jq '.reviews[] | select(.productId == "prod-123" and .status == "approved") | .rating' | awk '{sum+=$1; count++} END {print sum/count}'
```

---

## 🎯 Best Practices

1. **Backup the JSON file regularly** - It's the single source of truth for reviews
   ```bash
   cp reviews-data/reviews.json reviews-data/reviews.backup.json
   ```

2. **Monitor email sending** - Use admin dashboard to check sending status

3. **Approve reviews promptly** - Customers see reviews faster, encourages participation

4. **Check for failed emails** - Review the email logs and handle bounces

5. **Migrate to database** - For production, migrate from JSON to PostgreSQL/MongoDB for better scalability

---

## ❓ FAQ

**Q: Where are email provider logs?**
A: Check your email provider (SendGrid/Mailgun/SMTP) dashboard using messageId from emailResult

**Q: Can I delete review history?**
A: Edit `reviews-data/reviews.json` directly or use database backups. Do not edit while server is running.

**Q: How long are review requests stored?**
A: Indefinitely in JSON. Set `status: "expired"` manually to mark old ones as expired.

**Q: Can customers submit multiple reviews for one product?**
A: Currently no - one review request per order+product. This is enforced in `createReviewRequest()`.

---

For more details, check:
- `src/lib/reviewService.ts` - Core review logic
- `src/lib/reviewStore.ts` - Data persistence
- `src/app/api/reviews/` - API endpoints
- `src/types/review.ts` - Data types
