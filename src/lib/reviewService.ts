import crypto from "crypto";
import { formatISO, addDays } from "date-fns";
import {
insert,
query,
update,
} from "@/lib/wixReviewStore";
import { Review, ReviewRequest, ReviewSummary } from "@/types/review";
import { getAll } from "@/lib/wixReviewStore";

function getSafeDate(inputDate: string | Date | undefined, fallbackDate = new Date()) {
  if (!inputDate) {
    return fallbackDate;
  }

  const parsed = inputDate instanceof Date ? inputDate : new Date(inputDate);

  return Number.isNaN(parsed.getTime()) ? fallbackDate : parsed;
}

export async function getAllReviews(): Promise<Review[]> {
  return await getAll("Reviews");
}

export async function getAllReviewRequests(): Promise<ReviewRequest[]> {
  return await getAll("ReviewRequests");
}

export async function createReviewRequest(input: {
orderId: string;
productId: string;
customerId: string;
customerEmail: string;
deliveryDate: string;
sendAt?: string;
}): Promise<ReviewRequest> {

console.log("[reviewService] createReviewRequest start", {
  orderId: input.orderId,
  productId: input.productId,
  customerEmail: input.customerEmail,
  deliveryDate: input.deliveryDate,
});

const existing = await getReviewRequestByOrderAndProduct(
input.orderId,
input.productId
);


if (existing) {
console.log("[reviewService] existing review request found", {
  orderId: input.orderId,
  productId: input.productId,
  token: existing.token,
});
return existing;
}

const now = new Date();
const deliveryDate = getSafeDate(input.deliveryDate, now);
const sendAt = input.sendAt || formatISO(addDays(deliveryDate, 3));
const token = crypto.randomUUID();

const request: ReviewRequest = {
id: crypto.randomUUID(),
orderId: input.orderId,
productId: input.productId,
customerId: input.customerId,
customerEmail: input.customerEmail,
deliveryDate: deliveryDate.toISOString(),
sendAt,
token,
status: "pending",
createdAt: now.toISOString(),
updatedAt: now.toISOString(),
};

await insert("ReviewRequests", request);
console.log("[reviewService] inserted ReviewRequest", {
  orderId: input.orderId,
  productId: input.productId,
  token,
  deliveryDate: request.deliveryDate,
  sendAt,
});

return request;
}

export async function getReviewRequestByToken(
token: string
): Promise<ReviewRequest | undefined> {


console.log("Searching token:", token);


const result = (await query<ReviewRequest>(
"ReviewRequests",
"token",
token
));

const request = result[0];

console.log("Matched request:", request);

return request;
}
export async function markReviewRequestSent(token: string) {
const request = await getReviewRequestByToken(token);

if (!request) return;

await update(
"ReviewRequests",
request._id!,
{
    ...request,
    status:
    request.status === "reviewed"
        ? "reviewed"
        : "sent",
    updatedAt: new Date().toISOString(),
}
);
}
export async function markReviewRequestReviewed(token: string) {
const request = await getReviewRequestByToken(token);

if (!request) return;

await update(
"ReviewRequests",
request._id!,
{
    ...request,
    status: "reviewed",
    updatedAt: new Date().toISOString(),
}
);
}

export async function submitReview(input: {
token: string;
rating: number;
text: string;
photos?: string[];
}): Promise<Review> {
const request = await getReviewRequestByToken(input.token);
if (!request) {
throw new Error("Invalid review token.");
}
if (request.status === "reviewed") {
throw new Error("A review has already been submitted for this request.");
}
const now = new Date();
const review: Review = {
id: crypto.randomUUID(),
requestId: request.id || request._id!,
orderId: request.orderId,
productId: request.productId,
customerId: request.customerId,
customerEmail: request.customerEmail,
rating: input.rating,
text: input.text,
photos: input.photos || [],
status: "pending",
submittedAt: now.toISOString(),
createdAt: now.toISOString(),
updatedAt: now.toISOString(),
};


await insert("Reviews", review);
await markReviewRequestReviewed(input.token);

return review;
}

export async function approveReview(reviewId: string): Promise<Review | undefined> {

console.log("Review ID received:", reviewId);

const reviews = await query<Review>(
"Reviews",
"id",
reviewId
);

console.log("Query returned:", reviews);

const review = reviews[0];

if (!review) {
console.log("Review not found!");
return undefined;
}

await update(
"Reviews",
review._id!,
{
    ...review,
    status: "approved",
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
}
);

return {
...review,
status: "approved",
};
}
export async function getApprovedReviewsByProductId(
productId: string
): Promise<Review[]> {

console.log("Looking for Product ID:", productId);

const reviews = await query<Review>(
"Reviews",
"productId",
productId
);

 console.log("All reviews:", reviews);

  console.log(
    "Approved:",
    reviews.filter(r => r.status === "approved")
  );

return reviews
.filter((r) => r.status === "approved")
.sort(
    (a, b) =>
    new Date(b.submittedAt).getTime() -
    new Date(a.submittedAt).getTime()
);
}
export async function getRatingSummariesByProductIds(productIds: string[]) {
console.log(productIds);

const result: Record<
string,
{ averageRating: number; reviewCount: number }
> = {};

for (const productId of productIds) {

const reviews = await getApprovedReviewsByProductId(productId);

const reviewCount = reviews.length;

const averageRating =
reviewCount === 0
? 0
: reviews.reduce(
    (s: number, r: Review) => s + r.rating,
    0
    ) / reviewCount;

result[productId] = {
    averageRating,
    reviewCount,
};
}

return result;
}

export async function getReviewSummaryByProductId(productId: string): Promise<ReviewSummary> {
const reviews = await getApprovedReviewsByProductId(productId);
const reviewCount = reviews.length;
const averageRating = reviewCount === 0
? 0
: reviews.reduce(
    (sum: number, item: Review) => sum + item.rating,
    0
) / reviewCount;
return {
productId,
averageRating,
reviewCount,
reviews,
};
}

export async function getPendingReviews(): Promise<Review[]> {

const reviews = (await query<Review>(
"Reviews",
"status",
"pending"
));

return reviews;
}

export async function getPendingReviewRequests(): Promise<ReviewRequest[]> {

const requests = (await query<ReviewRequest>(
"ReviewRequests",
"status",
"pending"
));

const now = Date.now();
const ready = requests.filter((r) => {
  const sendAtTime = new Date(r.sendAt).getTime();
  return !Number.isNaN(sendAtTime) && sendAtTime <= now;
});

console.log("[reviewService] getPendingReviewRequests", {
  totalPending: requests.length,
  readyToSend: ready.length,
});

return ready;
}

export async function getReviewRequestByOrderAndProduct(
orderId: string,
productId: string
) {

const requests = (await query<ReviewRequest>(
"ReviewRequests",
"orderId",
orderId
));

return requests.find(
r => r.productId === productId
);
}

export async function markRequestExpired(token: string) {

const request = await getReviewRequestByToken(token);

if (!request) return;

await update(
"ReviewRequests",
request._id!,
{
    ...request,
    status: "expired",
    updatedAt: new Date().toISOString(),
}
);
}
export async function getAllReviewRequestsByOrder(
  orderId: string
): Promise<ReviewRequest[]> {
  return await query<ReviewRequest>(
    "ReviewRequests",
    "orderId",
    orderId
  );
}

export async function getPendingReviewRequestsGroupedByOrder(): Promise<
  Record<string, ReviewRequest[]>
> {
  const pending = await getPendingReviewRequests();

  const grouped: Record<string, ReviewRequest[]> = {};

  for (const request of pending) {
    if (!grouped[request.orderId]) {
      grouped[request.orderId] = [];
    }

    grouped[request.orderId].push(request);
  }

  console.log("[reviewService] getPendingReviewRequestsGroupedByOrder", {
    orderCount: Object.keys(grouped).length,
    requestCount: pending.length,
  });

  return grouped;
}
export async function reviewRequestExists(
  orderId: string,
  productId: string
): Promise<boolean> {
  const existing = await getReviewRequestByOrderAndProduct(
    orderId,
    productId
  );

  return !!existing;
}