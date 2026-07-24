"use client";

import { Review } from "@/types/review";
import ReviewStars from "@/Components/Review/ReviewStars";

type Props = {
  reviews: Review[];
};

const ReviewList = ({ reviews }: Props) => {
  if (reviews.length === 0) {
    return <div>No approved reviews yet for this product.</div>;
  }

  return (
    <div className="review-list" style={{ marginTop: 24 }}>
      <h3 style={{ marginBottom: 16 }}>Customer reviews</h3>
      {reviews.map((review) => (
        <div
          key={review.id}
          style={{
            marginBottom: 20,
            padding: 18,
            borderRadius: 12,
            background: "#ffffff",
            border: "1px solid #e5e7eb",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <ReviewStars rating={review.rating} />
            <span style={{ fontSize: 12, color: "#6b7280" }}>
              {new Date(review.submittedAt).toLocaleDateString()}
            </span>
          </div>
          <p style={{ marginTop: 12, color: "#111827" }}>{review.text}</p>
          {review.photos?.length > 0 && (
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
              {review.photos.map((photo, index) => {
                console.log(photo);

                return (
                    <img
                    key={index}
                    src={photo}
                    alt=""
                    width={80}
                    height={80}
                    />
                );
                })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ReviewList;
