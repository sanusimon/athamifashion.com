import wixClientServer from "@/lib/wixClientServer";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { media as wixMedia } from "@wix/sdk";
import { cookies } from "next/headers";
import { members } from "@wix/members";

// Fetch the order details inside the component
const OrderPage = async ({ params }) => {
  const { id } = params; // Wait for params to resolve before accessing `id`

  // Authenticate user from cookie and create an authenticated wix client
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get("refreshToken")?.value;
  if (!tokenCookie) {
    return <div className="container text-center empty_page"><p>Not logged in!</p></div>;
  }

  let refreshToken;
  try {
    refreshToken = JSON.parse(tokenCookie);
  } catch (err) {
    return <div className="container text-center empty_page"><p>Not logged in!</p></div>;
  }

  const wixClient = await wixClientServer(refreshToken);

  // Fetch current member to verify ownership
  let user;
  try {
    user = await wixClient.members.getCurrentMember({ fieldsets: [members.Set.FULL] });
  } catch (err) {
    return <div className="container text-center empty_page"><p>Not logged in!</p></div>;
  }

  let order;


  try {
    order = await wixClient.orders.getOrder(id); // Fetch the order details
    
  } catch (err) {
    return notFound(); // Return notFound if there is an error
  }
  // Ensure this order belongs to the authenticated user (if buyerInfo available)
  try {
    const buyerContactId = order?.buyerInfo?.contactId || order?.buyerInfo?.memberId || null;
    if (buyerContactId && user?.member?.contactId && buyerContactId !== user.member.contactId) {
      return notFound();
    }
  } catch (err) {
    // ignore and continue
  }
  // Safely determine a placed/purchased date to avoid Invalid Date errors
  const placedDate = order.purchasedDate || order._createdDate || new Date().toISOString();
  

  return (
    <div className="common_page">
      <div className="container">
        <h1 className="text-xl">Order Details</h1>

        <div className="item">
          <div className="head_ flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="box_ w-full md:w-auto flex flex-col md:flex-row md:items-center gap-4">
              <div>
                <span>Order placed</span>
                <span className="block md:inline">{format(new Date(placedDate), "dd-MM-yyyy")}</span>
              </div>
              <div className="">
                <span className="font-medium">Receiver Name: </span>
                <span className="block md:inline">
                  {order.billingInfo?.contactDetails?.firstName} {" "}
                  {order.billingInfo?.contactDetails?.lastName}
                </span>
              </div>
            </div>

            <div className="box_ mt-2 md:mt-0">
              <span>Order Number</span>
              <span className="block">{order._id}</span>
            </div>
          </div>
          <div className="body_">
            <div className="inner_ flex flex-col md:flex-row gap-6">
              <div className="w-full md:flex-1">
                <h3 className="font-bold">Shipping Address</h3>
                <p>{order.recipientInfo?.address?.addressLine1}</p>
                <p>{order.recipientInfo?.address?.city}</p>
                <p>{order.recipientInfo?.address?.postalCode}</p>
                <p>{order.recipientInfo?.address?.subdivisionFullname}</p>
                <p>{order.recipientInfo?.address?.countryFullname}</p>
              </div>
              <div className="w-full md:flex-1">
                {/* Order items with safe guards for image and product data */}
                {Array.isArray(order.lineItems) && order.lineItems.length > 0 && (
                  <div className="mb-4">
                    <h3 className="font-bold">Items</h3>
                    <div className="flex flex-col gap-3">
                      {order.lineItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          {item.image ? (
                            <img
                              src={wixMedia.getScaledToFillImageUrl(item.image, 72, 96, {})}
                              alt={item.productName?.original || 'product image'}
                              style={{ width: 72, height: 96, objectFit: 'cover', borderRadius: 8 }}
                            />
                          ) : (
                            <div style={{ width: 72, height: 96, background: '#f3f4f6', borderRadius: 8 }} />
                          )}
                          <div>
                            <div className="font-medium">{item.productName?.original || item.name || 'Product'}</div>
                            <div className="text-sm text-gray-500">Qty: {item.quantity || 1}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="w-full md:w-1/3">
                <h3 className="font-bold">Payment Status</h3>
                <div className="mb-4"><span className="text-right block">{order.paymentStatus}</span></div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <h3 className="font-bold mb-2">Order Summary</h3>
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
                  <div className="flex gap-4 justify-between mt-2">
                    <label className="font-bold">Grand Total:</label>
                    <span className="text-right font-bold">{order.priceSummary?.totalPrice?.formattedAmount}</span>
                  </div>
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
