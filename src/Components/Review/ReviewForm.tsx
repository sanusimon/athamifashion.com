"use client";

import { useState } from "react";

type Props = {
  token: string;
  productId: string;
};

const ReviewForm = ({ token }: Props) => {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const uploadImage = async (file: File): Promise<string> => {
  console.log("Calling /api/upload...");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  console.log("Upload Status:", res.status);

  



  const data = await res.json();

if (!res.ok || !data.url) {
  throw new Error(data.error || "Image upload failed");
}

return data.url;
};

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  console.log("===== SUBMIT CLICKED =====");
  console.log("Selected Images:", selectedImages);
  console.log("Image Count:", selectedImages.length);

  setStatus("submitting");

  try {
    const uploadedPhotos: string[] = [];

    for (const image of selectedImages) {
      console.log("Uploading:", image.name);

      const url = await uploadImage(image);

      console.log("Uploaded URL:", url);

      uploadedPhotos.push(url);
    }

    console.log("Final URLs:", uploadedPhotos);

    const response = await fetch("/api/reviews/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        rating,
        text,
        photos: uploadedPhotos,
      }),
    });

    console.log("Review Submit Status:", response.status);

    const result = await response.json();

console.log(result);

if (response.ok && result.success) {
  setStatus("success");
  setMessage("✅ Thank you! Your review has been submitted successfully.");

  setText("");
  setSelectedImages([]);
} else {
  setStatus("error");
  setMessage(result.error || "Failed to submit your review.");
}

  } catch (err) {
  console.error("ERROR:", err);

  setStatus("error");
  setMessage("Something went wrong. Please try again.");
}
};

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: 24,
        maxWidth: 680,
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 16,
        }}
      >
        <div>
          <label
            htmlFor="rating"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Rating
          </label>

          <select
            id="rating"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option key={value} value={value}>
                {value} Star{value > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="reviewText"
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Review
          </label>

          <textarea
            id="reviewText"
            rows={6}
            value={text}
            required
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell us what you liked..."
            style={{
              width: "100%",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #d1d5db",
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              marginBottom: 8,
              fontWeight: 600,
            }}
          >
            Upload Photos (Optional)
          </label>

          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              if (!e.target.files) return;

              setSelectedImages(Array.from(e.target.files));
            }}
          />

          {selectedImages.length > 0 && (
            <div
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginTop: 12,
              }}
            >
              {selectedImages.map((image, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(image)}
                  alt={`Preview ${index + 1}`}
                  style={{
                    width: 90,
                    height: 90,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              ))}
            </div>
          )}
        </div>

       <button
  type="submit"
  disabled={status === "submitting" || status === "success"}
  style={{
    padding: "14px 20px",
    borderRadius: 10,
    border: "none",
    background: "#10b981",
    color: "#fff",
    fontWeight: 700,
    cursor:
      status === "submitting" || status === "success"
        ? "not-allowed"
        : "pointer",
    opacity:
      status === "submitting" || status === "success"
        ? 0.7
        : 1,
  }}
>
  {status === "submitting"
    ? "Submitting..."
    : status === "success"
    ? "Review Submitted ✓"
    : "Submit Review"}
</button>

        {message && (
          <div
            style={{
              color:
                status === "error"
                  ? "#dc2626"
                  : "#047857",
              fontWeight: 600,
            }}
          >
            {message}
          </div>
        )}
      </div>
    </form>
  );
};

export default ReviewForm;