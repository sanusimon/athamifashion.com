import crypto from "crypto";
import { formatISO, addDays } from "date-fns";
import { readReviewData, writeReviewData } from "@/lib/reviewStore";
import { Review, ReviewRequest, ReviewStatus, ReviewRequestStatus, ReviewSummary } from "@/types/review";

export async function createReviewRequest(input: {
  orderId: string;
  productId: string;
  customerId: string;
  customerEmail: string;
  deliveryDate: string;
  sendAt?: string;
}): Promise<ReviewRequest> {
  const data = await readReviewData();
  const existing = data.requests.find(
    (request) =>
      request.orderId === input.orderId && request.productId === input.productId
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

  data.requests.push(request);
  await writeReviewData(data);
  return request;
}

export async function getReviewRequestByToken(token: string): Promise<ReviewRequest | undefined> {
  const data = await readReviewData();
  return data.requests.find((request) => request.token === token);
}

export async function markReviewRequestSent(token: string): Promise<void> {
  const data = await readReviewData();
  const request = data.requests.find((item) => item.token === token);
  if (!request) return;
  request.status = request.status === "reviewed" ? "reviewed" : "sent";
  request.updatedAt = new Date().toISOString();
  await writeReviewData(data);
}

export async function markReviewRequestReviewed(token: string): Promise<void> {
  const data = await readReviewData();
  const request = data.requests.find((item) => item.token === token);
  if (!request) return;
  request.status = "reviewed";
  request.updatedAt = new Date().toISOString();
  await writeReviewData(data);
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
    requestId: request.id,
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

  const data = await readReviewData();
  data.reviews.push(review);
  await writeReviewData(data);
  await markReviewRequestReviewed(input.token);

  return review;
}

export async function approveReview(reviewId: string): Promise<Review | undefined> {
  const data = await readReviewData();
  const review = data.reviews.find((item) => item.id === reviewId);
  if (!review) {
    return undefined;
  }
  review.status = "approved";
  review.approvedAt = new Date().toISOString();
  review.updatedAt = new Date().toISOString();
  await writeReviewData(data);
  return review;
}

export async function getApprovedReviewsByProductId(productId: string): Promise<Review[]> {
  const data = await readReviewData();
  return data.reviews
    .filter((review) => review.productId === productId && review.status === "approved")
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export async function getRatingSummariesByProductIds(productIds: string[]): Promise<Record<string, { averageRating: number; reviewCount: number }>> {
  const data = await readReviewData();
  const result: Record<string, { averageRating: number; reviewCount: number }> = {};

  productIds.forEach((productId) => {
    const reviews = data.reviews.filter(
      (review) => review.productId === productId && review.status === "approved"
    );
    const reviewCount = reviews.length;
    const averageRating = reviewCount === 0 ? 0 : reviews.reduce((sum, item) => sum + item.rating, 0) / reviewCount;
    result[productId] = { averageRating, reviewCount };
  });

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
  const data = await readReviewData();
  return data.reviews.filter((review) => review.status === "pending");
}

export async function getPendingReviewRequests(): Promise<ReviewRequest[]> {
  const data = await readReviewData();
  const now = new Date();
  return data.requests.filter((request) => {
    return (
      request.status === "pending" &&
      new Date(request.sendAt).getTime() <= now.getTime()
    );
  });
}

export async function getReviewRequestByOrderAndProduct(orderId: string, productId: string): Promise<ReviewRequest | undefined> {
  const data = await readReviewData();
  return data.requests.find(
    (item) => item.orderId === orderId && item.productId === productId
  );
}

export async function markRequestExpired(token: string): Promise<void> {
  const data = await readReviewData();
  const request = data.requests.find((item) => item.token === token);
  if (!request) return;
  request.status = "expired";
  request.updatedAt = new Date().toISOString();
  await writeReviewData(data);
}
