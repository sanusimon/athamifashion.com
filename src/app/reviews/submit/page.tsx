"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ReviewForm from "@/Components/Review/ReviewForm";

const ReviewSubmitPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [reviewTokenValid, setReviewTokenValid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productId, setProductId] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Missing review link token.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/reviews/verify?token=${encodeURIComponent(token)}`);
        const result = await response.json();
        if (!response.ok || !result.valid) {
          setError(result.error || "Invalid or expired review token.");
        } else {
          setReviewTokenValid(true);
          setProductId(result.reviewRequest.productId || "");
        }
      } catch (err) {
        setError("Unable to validate review link. Please try again later.");
      }

      setLoading(false);
    };

    verifyToken();
  }, [token]);

  return (
    <section className="review-submit-page" style={{ padding: "40px 20px" }}>
      <div className="container" style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, marginBottom: 16 }}>Share your feedback</h1>
        <p style={{ color: "#4b5563", marginBottom: 24 }}>
          Thank you for shopping with AthamiFashion. Please share your honest review for the product you purchased.
        </p>

        {loading ? (
          <div>Validating review link...</div>
        ) : error ? (
          <div style={{ color: "#dc2626", fontWeight: 600 }}>{error}</div>
        ) : (
          reviewTokenValid && <ReviewForm token={token} productId={productId} />
        )}
      </div>
    </section>
  );
};

export default ReviewSubmitPage;
