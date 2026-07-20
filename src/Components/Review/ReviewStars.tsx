"use client";

import React from "react";

type ReviewStarsProps = {
  rating: number;
  count?: number;
};

const ReviewStars = ({ rating, count }: ReviewStarsProps) => {
  const normalizedRating = Math.max(0, Math.min(5, rating));
  const fullStars = Math.floor(normalizedRating);
  const halfStar = normalizedRating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="review-stars" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
      {[...Array(fullStars)].map((_, index) => (
        <span key={`full-${index}`} style={{ color: "#f59e0b" }}>★</span>
      ))}
      {halfStar && <span style={{ color: "#f59e0b" }}>⯪</span>}
      {[...Array(emptyStars)].map((_, index) => (
        <span key={`empty-${index}`} style={{ color: "#d1d5db" }}>★</span>
      ))}
      {typeof count === "number" && (
        <span style={{ marginLeft: 8, color: "#6b7280", fontSize: 12 }}>
          ({count})
        </span>
      )}
    </div>
  );
};

export default ReviewStars;
