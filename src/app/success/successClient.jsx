"use client";
import { useSearchParams } from "next/navigation";
import Skeleton from "@/Components/Skeleton";

const SuccessClient = () => {
  const params = useSearchParams();
  const orderId = params.get("orderId");

  return (
    <div>
      <h1>Success!</h1>
      <p>Your order ID is: {orderId}</p>
      <Skeleton />
    </div>
  );
};

export default SuccessClient;
