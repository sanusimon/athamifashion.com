import { wixClientServer } from "@/lib/wixClientServer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { media as wixMedia } from "@wix/sdk";

// Fetch the order details inside the component
const OrderPage = async ({ params }) => {
  const { id } = await params; // Wait for params to resolve before accessing `id`

  // Fetch order details
  const wixClient = await wixClientServer();
  let order;

  try {
    order = await wixClient.orders.getOrder(id); // Fetch the order details
  } catch (err) {
    return notFound(); // Return notFound if there is an error
  }
  

  return (
    <div className="common_page">
      <div className="container">
        <h1 className="text-xl">Order Details</h1>

        <div className="item">
          <div className="head_">
            <div className="box_ flex gap-6">
              <div>
                <span>Order placed</span>
                <span>{format(new Date(order.purchasedDate), "dd-MM-yyyy")}</span>
              </div>
              <div className="">
              <span className="font-medium">Receiver Name: </span>
              <span>
                {order.billingInfo?.contactDetails?.firstName}{" "}
                {order.billingInfo?.contactDetails?.lastName}
              </span>
            </div>
            </div>
            
            <div className="box_">
              <span>Order Number</span>
              <span>{order._id}</span>
            </div>
          </div>
          <div className="body_">
            <div className="inner_">
              <div>
                <h3 className="font-bold">Shipping Address</h3>
                <p>{order.recipientInfo?.address?.addressLine1}</p>
                <p>{order.recipientInfo?.address?.city}</p>
                <p>{order.recipientInfo?.address?.postalCode}</p>
                <p>{order.recipientInfo?.address?.subdivisionFullname}</p>
                <p>{order.recipientInfo?.address?.countryFullname}</p>
              </div>
              <div>
              <h3 className="font-bold">Payment Status</h3>
                <span className="text-right">{order.paymentStatus}</span>
              </div>
              <div className="w-64">
                <h3 className="font-bold">Order Summary</h3>
                <div className="flex gap-4 justify-between">
                  <label>Item(s) Subtotal:</label>
                  <span className="text-right">{order.priceSummary?.subtotal?.formattedAmount}</span>
                </div>
                <div className="flex gap-4 justify-between">
                  <label>Shipping:</label>
                  <span className="text-right">{order.priceSummary?.shipping?.formattedAmount}</span>
                </div>
                <div className="flex gap-4 justify-between">
                  <label>discount:</label>
                  <span className="text-right">{order.priceSummary?.discount?.formattedAmount}</span>
                </div>
                <div className="flex gap-4 justify-between">
                  <label className="font-bold">Grand Total:</label>
                  <span className="text-right font-bold">{order.priceSummary?.totalPrice?.formattedAmount}</span>
                </div>
              </div>
            </div>
          </div>

        
          
        </div>

        <Link href="/" className="underline mt-6">
          Have a problem? Contact us
        </Link>
      </div>
    </div>
  );
};

export default OrderPage;
