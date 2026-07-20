"use client";

import { useState } from "react";

type Props = {
  token: string;
  productId: string;
};

const ReviewForm = ({ token, productId }: Props) => {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const addPhoto = () => {
    if (!photoUrl.trim()) return;
    setPhotos((current) => [...current, photoUrl.trim()]);
    setPhotoUrl("");
  };

  const removePhoto = (index: number) => {
    setPhotos((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, rating, text, photos }),
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        setStatus("error");
        setMessage(result.error || "Unable to submit review.");
        return;
      }

      setStatus("success");
      setMessage("Thank you! Your review was submitted and is pending approval.");
      setText("");
      setPhotos([]);
    } catch (error) {
      setStatus("error");
      setMessage("Unable to submit review. Please try again later.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 24, maxWidth: 680 }}>
      <div style={{ display: "grid", gap: 16 }}>
        <div>
          <label htmlFor="rating" style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            Rating
          </label>
          <select
            id="rating"
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} star{value > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="reviewText" style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            Review
          </label>
          <textarea
            id="reviewText"
            rows={6}
            value={text}
            onChange={(event) => setText(event.target.value)}
            style={{ width: "100%", padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
            placeholder="Tell us what you liked or what could be improved."
            required
          />
        </div>

        <div>
          <label htmlFor="photoUrl" style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            Optional photo URL
          </label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              id="photoUrl"
              type="url"
              value={photoUrl}
              onChange={(event) => setPhotoUrl(event.target.value)}
              placeholder="https://example.com/photo.jpg"
              style={{ flex: 1, padding: 12, borderRadius: 8, border: "1px solid #d1d5db" }}
            />
            <button type="button" onClick={addPhoto} style={{ padding: "12px 18px", borderRadius: 8, background: "#2563eb", color: "#fff", border: "none" }}>
              Add
            </button>
          </div>
          {photos.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
              {photos.map((photo, index) => (
                <div key={index} style={{ position: "relative" }}>
                  <img src={photo} alt={`Review photo ${index + 1}`} style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8, border: "1px solid #e5e7eb" }} />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    style={{
                      position: "absolute",
                      top: -8,
                      right: -8,
                      borderRadius: "50%",
                      width: 24,
                      height: 24,
                      border: "none",
                      background: "#ef4444",
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={status === "submitting"}
          style={{
            padding: "14px 20px",
            borderRadius: 10,
            border: "none",
            background: "#10b981",
            color: "white",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          {status === "submitting" ? "Submitting..." : "Submit review"}
        </button>

        {message && (
          <div style={{ color: status === "error" ? "#dc2626" : "#047857", fontWeight: 600 }}>
            {message}
          </div>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;
