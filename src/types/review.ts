export type ReviewStatus = "pending" | "approved" | "rejected";
export type ReviewRequestStatus = "pending" | "sent" | "reviewed" | "expired";

export type ReviewRequest = {
 _id?: string;   // ← Add this
  id: string;
  orderId: string;
  productId: string;
  customerId: string;
  customerEmail: string;
  deliveryDate: string;
  sendAt: string;
  token: string;
  status: ReviewRequestStatus;
  createdAt: string;
  updatedAt: string;
};

export type Review = {
  _id?: string;
  id: string;
  requestId: string;
  orderId: string;
  productId: string;
  customerId: string;
  customerEmail: string;
  rating: number;
  text: string;
  photos: string[];
  status: ReviewStatus;
  submittedAt: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewSummary = {
  productId: string;
  averageRating: number;
  reviewCount: number;
  reviews: Review[];
};
