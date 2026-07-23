// import { NextResponse } from "next/server";
// import { readReviewData } from "@/lib/reviewStore";

// export async function GET() {
//   try {
//     const data = await readReviewData();
    
//     return NextResponse.json({
//       summary: {
//         totalRequests: data.requests.length,
//         totalReviews: data.reviews.length,
//         sentEmails: data.requests.filter((r) => r.status === "sent").length,
//         pendingReviews: data.reviews.filter((r) => r.status === "pending").length,
//         approvedReviews: data.reviews.filter((r) => r.status === "approved").length,
//         rejectedReviews: data.reviews.filter((r) => r.status === "rejected").length,
//       },
//       requests: data.requests,
//       reviews: data.reviews,
//     });
//   } catch (error) {
//     return NextResponse.json(
//       { error: "Failed to fetch review data", details: String(error) },
//       { status: 500 }
//     );
//   }
// }
