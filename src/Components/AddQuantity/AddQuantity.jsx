"use client"
import React, { useCallback, useEffect, useState } from 'react'
import './AddQuantity.scss'
import { useWixClient } from '@/hooks/useWixClient';
import { useCartStore } from '@/hooks/useCartStore';
import { useRouter } from 'next/navigation';
function AddQuantity({productId,variantId,stockNumber , isSelected}) {
    const [quantity , setQuantity] = useState(1);
    
    useEffect(() => {
        setQuantity(1); // Reset quantity when stockNumber changes
    }, [stockNumber]);
    
    const handleQuantity = (type) => {
        if (type === "d" && quantity > 1) {
          setQuantity((prev) => prev - 1);
        }
        if (type === "i" && quantity < stockNumber) {
          setQuantity((prev) => prev + 1);
        }
      };

      const wixClient = useWixClient();

      const {addItem , isLoading} = useCartStore();
        const router = useRouter();

        const handleAddToCart = () => {
          addItem(wixClient, productId, variantId, quantity);
          if (addItem) {
            router.push("/cart");
          }
        }
          
       
      

  return (
    <div className='quant_cart'>
        <div className='quantity'>
            <span className='cart_label_'>Choose Quantity</span>
            <span className='quantity_field'>
              <div>
                <label className='qnty_btn minus' onClick={() => handleQuantity("d")} disabled={quantity === 1}>-</label>
                    <p>{quantity}</p>
                <label className='qnty_btn plus' onClick={() => handleQuantity("i")} disabled={quantity === stockNumber}>+</label>
                </div>
                {stockNumber < 1 ? (<span className='dont_miss'>Product is out of stock</span>) 
                :(<span className='small_txt'>Only <span>  {stockNumber} items </span> left! <br />Don't Miss it</span>)} 
            </span>
           
            
        </div>
        
        <div className='cart_btn_div'>
            {/* <button onClick={()=>addItem(wixClient,productId,variantId,quantity)} className='add_cart' disabled={stockNumber < 1}>Add to Cart</button>
            {!isSelected && <span className='small_txt'>Choose Size and color</span>} */}
            <button
              onClick={handleAddToCart} // Use the function here
              className={!isSelected ? "add_cart disabled" : "add_cart"}
              disabled={stockNumber < 1}
            >
              Add to Cart
            </button>
            {!isSelected && <span className='small_txt'>Choose Size and color</span>}
        </div>
    </div>
  )
}

export default AddQuantity
  