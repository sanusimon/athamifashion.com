
"use client";

import React, { useEffect } from 'react'
import './cart.scss'

import { useCartStore } from '@/hooks/useCartStore';
import {media as wixMedia} from '@wix/sdk'
import Link from 'next/link';
import { useWixClient } from '@/hooks/useWixClient';
import { currentCart } from '@wix/ecom';


// import Quantity from '../../Components/Quantity/Quantity';
// import Link from 'next/link';

export const Cart = () => {

    const wixClient = useWixClient()
    const {cart , isLoading , removeItem ,updateQuantity, getCart } = useCartStore();

    useEffect(() => {
        if (wixClient) {
          getCart(wixClient); // 🔁 Fetch the persisted cart on load
        }
      }, [wixClient]);

    const handleCheckout = async () => {
        try {
          const checkout =
            await wixClient.currentCart.createCheckoutFromCurrentCart({
              channelType: currentCart.ChannelType.WEB,
            });
    
          const { redirectSession } =
            await wixClient.redirects.createRedirectSession({
              ecomCheckout: { checkoutId: checkout.checkoutId },
              callbacks: {
                postFlowUrl: window.location.origin,
                thankYouPageUrl: `${window.location.origin}/success`,
              },
            });
    
          if (redirectSession?.fullUrl) {
            window.location.href = redirectSession.fullUrl;
          }
        } catch (err) {
            console.error("❌ Checkout failed:", err?.message || err);
        }
      };
      
    

    // Function to calculate total discount
    const calculateTotalDiscount = () => {
        return cart.lineItems?.reduce((total, item) => {
          // Calculate the discount for each item (lineItemPrice - price)
          const discount = item.fullPrice.amount - item.price.amount;
          return total + discount * item.quantity; // Multiply by quantity
        }, 0);
      };
      
      const totalDiscount = calculateTotalDiscount();

    const handleQuantityChange = async (itemId, currentQuantity, action) => {
        const newQuantity = action === 'increase' ? currentQuantity + 1 : currentQuantity - 1;
        if (newQuantity > 0) {
          await updateQuantity(wixClient, itemId, newQuantity); // Update the quantity in the cart
        }
      };
      if (isLoading) {
        return <div className='min_height container text-center empty_page'><p>Loading your cart...</p></div>;
      }
    
      if (!cart || cart.length === 0) {
        return <div className='min_height container text-center'><p>Your cart is empty..</p></div>;
      }
      
      


    return (
       
        <section className="cart_page">
            <div className="container">
                    {
                    // isLoading ? ("Loading..." ): 
                    !cart.lineItems || cart.lineItems.length === 0 ? (
                        <div className="text-center text-gray-500 mt-8 empty_page">Cart is Empty</div>
                        ) : (
                        <div className='inner_'>
                            <div>
                            <h2 className='title'>Shopping Cart</h2>
                            {cart.lineItems?.map((item, index) => {
                                const productSlug = item.url ? item.url.split("/").pop() : "";
                                const size = item.descriptionLines?.find(line => line.name.original === 'Size')?.plainText?.original || 'N/A';
                                const color = item.descriptionLines?.find(line => line.name.original === 'Color')?.colorInfo?.original || 'N/A';
                              
                                return (
                                    <div key={index} >
                                        <div className="cart_item">
                                            {item.image && (
                                                <div className="cart_item_img">
                                                    <div className='img_wrp'>
                                                        <img src={wixMedia.getScaledToFillImageUrl(item.image,72,96,{})} />
                                                    </div>
                                                    <div className='for_mob'>
                                                        <Link href={`/${productSlug}`}>
                                                            <h2 className='cat_name'>{item.productName.original}</h2>
                                                            <span className='status_'>
                                                                {item.availability.status === "IN_STOCK" && "In Stock"}
                                                                {item.availability.status === "OUT_OF_STOCK" && "Out of Stock"}
                                                                {item.availability.status === "PARTIALLY_AVAILABLE" && "Only a few left!"}
                                                            </span>

                                                        </Link>
                                                    </div>
                                                </div>
                                            )}
                                            <div className='cart_rgt_'>
                                                <div className="cart_item_name">
                                                
                                                    <Link href={`/${productSlug}`}>
                                                        <h2 className='cat_name'>{item.productName.original}</h2>
                                                        <span className='status_'>
                                                            {item.availability.status === "IN_STOCK" && "In Stock"}
                                                            {item.availability.status === "OUT_OF_STOCK" && "Out of Stock"}
                                                            {item.availability.status === "PARTIALLY_AVAILABLE" && "Only a few left!"}
                                                        </span>
                                                    </Link>
                                                        
                                                    </div>
                                                    {/* <div className="cart_item_price">
                                                        <h2>{item.quantity && item.quantity>1 && <sup>{item.quantity} * </sup>} ${item.price.amount}</h2>
                                                        <h2 className='line_throw'>${item.fullPrice.amount}</h2>
                                                    </div> */}

                                                    <div className='cart_item_price'>
                                                        {item.price.amount === item.fullPrice.amount ? (
                                                            <h2>{item.quantity && item.quantity>1 && <sup>{item.quantity} x </sup>}{item.price.formattedAmount}</h2>

                                                        ) : 
                                                        
                                                        (
                                                            <><h2 className="">{item.price.formattedAmount}</h2> 
                                                                <h2 className=" line_throw">{item.fullPrice.formattedAmount}</h2> </>
                                                            )                    
                                                    }
                                                    </div>




                                                    <div className='btm_'>
                                                        <div className="cart_item_quantity">
                                                            <label className='btm_hd'>Qty :</label>
                                                            

                                                            <button
                                                                className='minus_'
                                                                onClick={() => handleQuantityChange(item._id, item.quantity, 'decrease')}
                                                                disabled={item.quantity <= 1}
                                                                >
                                                                -
                                                            </button>
                                                            <span>{item.quantity}</span>
                                                            <button
                                                                onClick={() => handleQuantityChange(item._id, item.quantity, 'increase')}
                                                                disabled={item.quantity >= 10} // Assuming 10 is the max quantity you can have in the cart
                                                                >
                                                                +
                                                                </button>
                                                            
                                                        </div>
                                                        <div className="cart_item_quantity">
                                                            <span  className='btm_hd'>Size : {size} </span>
                                                        </div>
                                                        <div className="cart_item_quantity">
                                                            <span  className='btm_hd'>Color : {color}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="cart_item_colour">
                                                        {/* <span>Qty : {item.choice.description} </span> */}
                                                    </div>
                                                    
                                                    <div className="delete_cart">
                                                        <button onClick={()=>removeItem(wixClient, item._id)}><img src="./bin.png" /></button>
                                                    </div>
                                                </div>

                                        
                                        </div>
                                        
                                    </div>
                                );
                            })}
                            </div>
            
                            <div className='checkout_sec'>
                                <div>
                                <h3 className='title'>Payment Information</h3>
                                <div className="cart_item_price sub_total">
                                    <label className='label'>Value of Products</label>
                                    <span>
                                    Rs.{cart.lineItems?.reduce((total, item) => {
  return total + item.fullPrice.amount * item.quantity;
}, 0).toFixed(2)}

                                    </span>
                                </div>
                                <div className="cart_item_price sub_total">
                                        <label className='label'>
                                        Discount(-)</label>
                                        <span>{totalDiscount ? `$${totalDiscount.toFixed(2)}` : '$0.00'}</span>
                                    </div>
                                {/* <div className="cart_item_price sub_total">
                                    <label className='label'>Shiping</label>
                                    <span>Shiping</span>
                                </div> */}
                                <div className="cart_item_price sub_total">
                                    <label className='label'> Order Total</label>
                                    <span>
                                    Rs.{cart.lineItems?.reduce((total, item) => {
                                    return total + item.price.amount * item.quantity;
                                    }, 0).toFixed(2)}

                                    </span>

                                </div>
                                <div className="cart_item_price sub_total">
                                    <label className='label'> <b>Net Payment</b></label>
                                    <span>
                                    Rs.{cart.lineItems?.reduce((total, item) => {
                                    return total + item.price.amount * item.quantity;
                                    }, 0).toFixed(2)}
                                    </span>
                                </div>
                                <button onClick={handleCheckout} className={isLoading ? "cmnBtn disabled" : "cmnBtn"} disabled={isLoading}>Checkout</button>
                                </div>
                            </div>
                        </div>
                        )
                    } 
                    
                        
            
               
            </div>
        </section>
    );
}

export default Cart