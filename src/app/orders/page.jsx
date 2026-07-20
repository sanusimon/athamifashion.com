import { cookies } from "next/headers";
import { wixClientServer } from "@/lib/wixClientServer";
import {media as wixMedia} from '@wix/sdk'
import { members } from "@wix/members";
import Link from "next/link";
import { format } from 'date-fns';


const Order = async () => {
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get("refreshToken")?.value;

  if (!tokenCookie) {
    return <div className='container text-center empty_page'><p>Not logged in!</p></div>;
  }

  let refreshToken;
  try {
    refreshToken = JSON.parse(tokenCookie);
  } catch (err) {
    return <div className='container text-center empty_page'><p>Not logged in!</p></div>;
  }

  const wixClient = await wixClientServer(refreshToken);

  let user;
  try {
    user = await wixClient.members.getCurrentMember({
      fieldsets: [members.Set.FULL],
    });
  } catch (err) {
    return  <div className='container text-center empty_page'><p>Not logged in!</p></div>;
  }

  if (!user.member?.contactId) {
    return  <div className='container text-center empty_page'><p>Not logged in!</p></div>;
  }

  const orderRes = await wixClient.orders.searchOrders({
    search: {
      filter: { "buyerInfo.contactId": { $eq: user.member.contactId } },
    },
  });

  const orders = Array.isArray(orderRes.orders) ? orderRes.orders : [];

  return (
    <div className="common_page">
      <div className="container">
        <h1 className="text-2xl">Orders</h1>
        <div className="mt-12 flex flex-col">
          {orders.length === 0 ? (
            <div className="text-center text-gray-500 mt-8 empty_page">You have no orders yet.</div>
          ) : (
            orders.map((order) => (
                <div className="item" key={order._id}>
                  
                    <div className="head_">
                        <div className="box_">
                            <span>Date</span>
                            <span>{order._createdDate ? format(new Date(order._createdDate), 'dd-MM-yyyy') : '—'}</span>
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
                        {Array.isArray(order.lineItems) && order.lineItems.length > 0 ? (
                            order.lineItems.map((lineItem,index)=>(
                                <div className="inner_" key={index}>
                                    <div className="left_">
                                        <div className="prod_img">
                                            {lineItem?.image ? (
                                                <img
                                                    src={wixMedia.getScaledToFillImageUrl(lineItem.image,72,96,{})}
                                                    alt={lineItem?.productName?.original || 'product image'}
                                                />
                                            ) : (
                                                <div className="w-[72px] h-[96px] bg-gray-100" />
                                            )}
                                        </div>
                                        <div className="prod_name cat_name">
                                            {lineItem?.productName?.original || lineItem?.name || 'Product'}
                                        </div>
                                    </div>
                                    <div className="right_ flex gap-4" >
                                        <div className="shipping_address">
                                            <p>{order.recipientInfo?.address?.addressLine1 ?? ''}</p>
                                            <p>{order.recipientInfo?.address?.city ?? ''}</p>
                                            <p>{order.recipientInfo?.address?.postalCode ?? ''}</p>
                                            <p>{order.recipientInfo?.address?.subdivisionFullname ?? ''}</p>
                                            <p>{order.recipientInfo?.address?.countryFullname ?? ''}</p>
                                        </div>
                                        <Link
                                            href={`/orders/${order._id}`} 
                                            className="underline block"
                                        ><span>View order detail</span>
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-gray-500">No items available for this order.</div>
                        )}
                    </div>
               
             
             </div>
          )))}
        </div>
      </div>
    </div>
  );
};

export default Order;
