// "use client";

// import { useRouter, useSearchParams } from "next/navigation";
// import { useEffect } from "react";
// import Confetti from "react-confetti";

// const SuccessPage = () => {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   const orderId = searchParams.get("orderId");

//   useEffect(() => {
//     if (!orderId) {
//       // Fallback redirect if no orderId found
//       const fallbackTimer = setTimeout(() => {
//         router.replace("/orders");
//       }, 3000);
//       return () => clearTimeout(fallbackTimer);
//     }

//     // Redirect to order details after 5 seconds
//     const timer = setTimeout(() => {
//       router.replace(`/orders/${orderId}`);
//     }, 5000);

//     return () => clearTimeout(timer);
//   }, [orderId, router]);

//   return (
//     <div className="flex flex-col gap-6 items-center justify-center h-[calc(100vh-180px)] p-6 text-center">
//       <Confetti width={window.innerWidth} height={window.innerHeight} />
//       <h1 className="text-5xl md:text-6xl font-bold text-green-700">Payment Successful 🎉</h1>
//       <h2 className="text-lg md:text-xl font-medium text-gray-700">
//         Thank you for your purchase!
//       </h2>
//       <p className="text-gray-500">
//         We’ve sent a confirmation email with your invoice.
//       </p>
//       <p className="text-sm text-gray-400">
//         Redirecting you to your order details page in a few seconds...
//       </p>
//     </div>
//   );
// };

//export default SuccessPage;


"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import Confetti from "react-confetti";

const SuccessPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (!orderId) return;

    const timer = setTimeout(() => {
      router.push(`/success/orders/${orderId}`);
    }, 3000);

    return () => clearTimeout(timer);
  }, [orderId, router]);

  return (
    <div className="flex flex-col gap-6 items-center justify-center h-[calc(100vh-180px)] p-6 text-center">
      <Confetti width={window.innerWidth} height={window.innerHeight} />
      <h1 className="text-5xl md:text-6xl font-bold text-green-700">Payment Successful 🎉</h1>
      <h2 className="text-lg md:text-xl font-medium text-gray-700">
        Thank you for your purchase!
      </h2>
      <p className="text-gray-500">
        We’ve sent a confirmation email with your invoice.
      </p>
      <p className="text-sm text-gray-400">
        Redirecting you to your order details page in a few seconds...
      </p>
    </div>
  );
};

export default SuccessPage;

