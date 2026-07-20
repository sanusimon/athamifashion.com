"use client";

import ReviewStars from "@/Components/Review/ReviewStars";
import { ReviewSummary as ReviewSummaryType } from "@/types/review";

type Props = {
  summary: ReviewSummaryType;
};

const ReviewSummary = ({ summary }: Props) => {
  return (
    <div className="review-summary" style={{ marginTop: 24, padding: 24, background: "#fafafa", borderRadius: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <strong style={{ fontSize: 28 }}>{summary.averageRating.toFixed(1)}</strong>
          <div style={{ color: "#6b7280", fontSize: 14 }}>average rating</div>
        </div>
        <ReviewStars rating={summary.averageRating} count={summary.reviewCount} />
      </div>
      <div style={{ marginTop: 12, color: "#4b5563" }}>
        {summary.reviewCount === 0
          ? "Be the first to review this product."
          : `${summary.reviewCount} review${summary.reviewCount === 1 ? "" : "s"} approved.`}
      </div>
    </div>
  );
};

export default ReviewSummary;
