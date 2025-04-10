import { cookies } from "next/headers";
import { wixClientServer } from "@/lib/wixClientServer";
import { updateUser } from "@/lib/action";
import {media as wixMedia} from '@wix/sdk'
import { members } from "@wix/members";
import Link from "next/link";
import { format } from 'date-fns';


const Order = async () => {
  // ✅ Get refreshToken here — it's allowed in server components
  const cookieStore = cookies();
  const refreshToken = JSON.parse(cookieStore.get("refreshToken")?.value || "{}");

  // ✅ Pass it in
  const wixClient = await wixClientServer(refreshToken);

  const user = await wixClient.members.getCurrentMember({
    fieldsets: [members.Set.FULL],
  });

  if (!user.member?.contactId) {
    return <div>Not logged in!</div>;
  }

  const orderRes = await wixClient.orders.searchOrders({
    search: {
      filter: { "buyerInfo.contactId": { $eq: user.member.contactId } },
    },
  });
// console.log(orderRes)
  return (
    <div className="common_page">
      <div className="container">
        <h1 className="text-2xl">Orders</h1>
        <div className="mt-12 flex flex-col">
          {orderRes.orders.map((order) => (
                <div className="item" key={order._id}>
                  
                    <div className="head_">
                        <div className="box_">
                            <span>Date</span>
                            <span>{format(new Date(order._createdDate), 'dd-MM-yyyy')}</span>
                        </div>
                        <div className="box_">
                            <span>Total</span>
                            <span>{order.priceSummary?.subtotal?.amount}</span>
                        </div>
                        <div className="box_">
                            <span>Ship to</span>
                            <span>{order.recipientInfo?.contactDetails?.firstName}</span>
                        </div>
                        <div className="box_">
                            <span>Order status</span>
                            <span>{order.status}</span>
                        </div>
                        <div className="box_">
                            <span>Order #</span>
                            <span>{order._id}</span>
                        </div>
                    </div>
                    <div className="body_">
                        {order.lineItems.map((lineItem,index)=>(
                            
                            <div className="inner_" key={index}>
                            <div className="left_">
                                <div className="prod_img">
                                    <img src={wixMedia.getScaledToFillImageUrl(lineItem.image,72,96,{})} />
                                </div>
                                <div className="prod_name cat_name">
                                {lineItem?.productName?.original}
                                </div>
                            </div>
                            <div className="right_ flex gap-4" >
                              <div className="shipping_address">
                                <p>{order.recipientInfo?.address?.addressLine1}</p>
                                <p>{order.recipientInfo?.address?.city}</p>
                                <p>{order.recipientInfo?.address?.postalCode}</p>
                                <p>{order.recipientInfo?.address?.subdivisionFullname}</p>
                                <p>{order.recipientInfo?.address?.countryFullname}</p>
                                
                              </div>
                            <Link
                                href={`/orders/${order._id}`} 
                                className="underline block"
                              ><span>View order detail</span>
                            </Link>
                            </div>
                            </div>
                        ))}
                        
                    </div>
               
             
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Order;
