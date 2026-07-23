"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./admin-reviews.module.css";

type ReviewRequest = {
  id: string;
  orderId: string;
  productId: string;
  customerId: string;
  customerEmail: string;
  deliveryDate: string;
  sendAt: string;
  token: string;
  status: "pending" | "sent" | "reviewed" | "expired";
  createdAt: string;
  updatedAt: string;
};

type Review = {
  id: string;
  requestId: string;
  orderId: string;
  productId: string;
  customerId: string;
  customerEmail: string;
  rating: number;
  text: string;
  photos: string[];
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export default function AdminReviewsPage() {
  const [activeTab, setActiveTab] = useState<"emails" | "pending" | "approved" | "rejected">("emails");
  const [requests, setRequests] = useState<ReviewRequest[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all review data from admin API
        const res = await fetch("/api/admin/reviews");

        if (!res.ok) {
          throw new Error("Failed to fetch review data");
        }

        const data = await res.json();
        setRequests(data.requests || []);
        setReviews(data.reviews || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleApprove = async (reviewId: string) => {
  try {
    const res = await fetch(`/api/reviews/${reviewId}/approve`, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error("Failed to approve");
    }

    const data = await res.json();
    console.log(data);

    // Refresh list
    window.location.reload();
  } catch (err) {
    console.error(err);
    alert("Failed to approve review");
  }
};

  if (loading) return <div className={styles.container}><p>Loading...</p></div>;
  if (error) return <div className={styles.container}><p className={styles.error}>Error: {error}</p></div>;

  const sentEmails = requests.filter((r) => r.status === "sent");
  const pendingReviews = reviews.filter((r) => r.status === "pending");
  const approvedReviews = reviews.filter((r) => r.status === "approved");
  const rejectedReviews = reviews.filter((r) => r.status === "rejected");

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>📧 Review System Admin</h1>
        <p>Manage review requests and customer reviews</p>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === "emails" ? styles.active : ""}`}
          onClick={() => setActiveTab("emails")}
        >
          📬 Email History ({sentEmails.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "pending" ? styles.active : ""}`}
          onClick={() => setActiveTab("pending")}
        >
          ⏳ Pending Reviews ({pendingReviews.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "approved" ? styles.active : ""}`}
          onClick={() => setActiveTab("approved")}
        >
          ✅ Approved ({approvedReviews.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === "rejected" ? styles.active : ""}`}
          onClick={() => setActiveTab("rejected")}
        >
          ❌ Rejected ({rejectedReviews.length})
        </button>
      </div>

      {/* Email History Tab */}
      {activeTab === "emails" && (
        <div className={styles.content}>
          <h2>Review Request Email Sending History</h2>
          {sentEmails.length === 0 ? (
            <p className={styles.empty}>No emails sent yet</p>
          ) : (
            <div className={styles.table}>
              <table>
                <thead>
                  <tr>
                    <th>Customer Email</th>
                    <th>Order ID</th>
                    <th>Product ID</th>
                    <th>Sent Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sentEmails.map((req) => (
                    <tr key={req.id}>
                      <td>{req.customerEmail}</td>
                      <td>{req.orderId.slice(0, 12)}...</td>
                      <td>{req.productId.slice(0, 12)}...</td>
                      <td>{formatDate(req.sendAt)}</td>
                      <td className={styles.badge}>{req.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pending Reviews Tab */}
      {activeTab === "pending" && (
        <div className={styles.content}>
          <h2>Pending Reviews (Awaiting Approval)</h2>
          {pendingReviews.length === 0 ? (
            <p className={styles.empty}>No pending reviews</p>
          ) : (
            <div className={styles.reviews}>
              {pendingReviews.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div>
                      <p className={styles.customerEmail}>{review.customerEmail}</p>
                      <p className={styles.orderId}>Order: {review.orderId.slice(0, 12)}...</p>
                    </div>
                    <div className={styles.rating}>{"⭐".repeat(review.rating)}</div>
                  </div>
                  <p className={styles.reviewText}>{review.text}</p>
                  {review.photos.length > 0 && (
                    <div className={styles.photos}>
                      {review.photos.map((photo, idx) => (
                        <img key={idx} src={photo} alt={`Review photo ${idx + 1}`} />
                      ))}
                    </div>
                  )}
                  <div className={styles.reviewFooter}>
                    <p className={styles.date}>Submitted: {formatDate(review.submittedAt)}</p>
                    <div className={styles.actions}>
                      <button
                        className={styles.approveBtn}
                        onClick={() => handleApprove(review.id)}
                      >
                        ✅ Approve
                      </button>
                      <button className={styles.rejectBtn}>❌ Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approved Reviews Tab */}
      {activeTab === "approved" && (
        <div className={styles.content}>
          <h2>Approved Reviews</h2>
          {approvedReviews.length === 0 ? (
            <p className={styles.empty}>No approved reviews yet</p>
          ) : (
            <div className={styles.reviews}>
              {approvedReviews.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div>
                      <p className={styles.customerEmail}>{review.customerEmail}</p>
                      <p className={styles.orderId}>Order: {review.orderId.slice(0, 12)}...</p>
                    </div>
                    <div className={styles.rating}>{"⭐".repeat(review.rating)}</div>
                  </div>
                  <p className={styles.reviewText}>{review.text}</p>
                  {review.photos.length > 0 && (
                    <div className={styles.photos}>
                      {review.photos.map((photo, idx) => (
                        <img key={idx} src={photo} alt={`Review photo ${idx + 1}`} />
                      ))}
                    </div>
                  )}
                  <div className={styles.reviewFooter}>
                    <p className={styles.date}>
                      Submitted: {formatDate(review.submittedAt)}
                      {review.approvedAt && ` • Approved: ${formatDate(review.approvedAt)}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rejected Reviews Tab */}
      {activeTab === "rejected" && (
        <div className={styles.content}>
          <h2>Rejected Reviews</h2>
          {rejectedReviews.length === 0 ? (
            <p className={styles.empty}>No rejected reviews</p>
          ) : (
            <div className={styles.reviews}>
              {rejectedReviews.map((review) => (
                <div key={review.id} className={styles.reviewCard}>
                  <div className={styles.reviewHeader}>
                    <div>
                      <p className={styles.customerEmail}>{review.customerEmail}</p>
                      <p className={styles.orderId}>Order: {review.orderId.slice(0, 12)}...</p>
                    </div>
                    <div className={styles.rating}>{"⭐".repeat(review.rating)}</div>
                  </div>
                  <p className={styles.reviewText}>{review.text}</p>
                  <div className={styles.reviewFooter}>
                    <p className={styles.date}>Submitted: {formatDate(review.submittedAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className={styles.footer}>
        <Link href="/">← Back to Home</Link>
        <p className={styles.hint}>💡 Raw data stored at: /reviews-data/reviews.json</p>
      </div>
    </div>
  );
}
