import crypto from "crypto";
import { formatISO, addDays } from "date-fns";
import {
    insert,
    query,
    update,
} from "@/lib/wixReviewStore";
import { Review, ReviewRequest, ReviewSummary } from "@/types/review";

export async function createReviewRequest(input: {
  orderId: string;
  productId: string;
  customerId: string;
  customerEmail: string;
  deliveryDate: string;
  sendAt?: string;
}): Promise<ReviewRequest> {
  
 const existing = await getReviewRequestByOrderAndProduct(
  input.orderId,
  input.productId
);


  if (existing) {
    return existing;
  }

  const now = new Date();
  const deliveryDate = new Date(input.deliveryDate);
  const sendAt = input.sendAt || formatISO(addDays(deliveryDate, 5));
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
  
  return request;
}

export async function getReviewRequestByToken(
  token: string
): Promise<ReviewRequest | undefined> {
  

  console.log("Searching token:", token);
  

  const result = await query(
    "ReviewRequests",
    "token",
    token
);

const request = result[0];

  console.log("Matched request:", request);

  return request;
}
export async function markReviewRequestSent(token: string) {
  const request = await getReviewRequestByToken(token);

  if (!request) return;

  await update(
    "ReviewRequests",
    request._id,
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
    request._id,
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
    requestId: request.id || request._id,
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
  
  const reviews = await query(
   "Reviews",
   "id",
   reviewId
);

const review = reviews[0];

if (!review) return undefined;
  
  await update(
  "Reviews",
  review._id,
  {
    ...review,
    status: "approved",
    approvedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
);

return {
  ...review,
  status: "approved"
};
}
export async function getApprovedReviewsByProductId(
  productId: string
): Promise<Review[]> {

  const reviews = await query(
    "Reviews",
    "productId",
    productId
  );

  return reviews
    .filter(r => r.status === "approved")
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() -
        new Date(a.submittedAt).getTime()
    );
}
export async function getRatingSummariesByProductIds(productIds: string[]) {

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
        : reviews.reduce((s, r) => s + r.rating, 0) / reviewCount;

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
  const averageRating = reviewCount === 0 ? 0 : reviews.reduce((sum, item) => sum + item.rating, 0) / reviewCount;
  return {
    productId,
    averageRating,
    reviewCount,
    reviews,
  };
}

export async function getPendingReviews(): Promise<Review[]> {

  const reviews = await query(
    "Reviews",
    "status",
    "pending"
  );

  return reviews;
}

export async function getPendingReviewRequests(): Promise<ReviewRequest[]> {

  const requests = await query(
    "ReviewRequests",
    "status",
    "pending"
  );

  const now = Date.now();

  return requests.filter(
    r => new Date(r.sendAt).getTime() <= now
  );
}

export async function getReviewRequestByOrderAndProduct(
  orderId: string,
  productId: string
) {

  const requests = await query(
    "ReviewRequests",
    "orderId",
    orderId
  );

  return requests.find(
    r => r.productId === productId
  );
}

export async function markRequestExpired(token: string) {

  const request = await getReviewRequestByToken(token);

  if (!request) return;

  await update(
    "ReviewRequests",
    request._id,
    {
      ...request,
      status: "expired",
      updatedAt: new Date().toISOString(),
    }
  );
}