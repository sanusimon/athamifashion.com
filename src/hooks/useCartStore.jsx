import { create } from 'zustand'
import { WixClient } from "@/Context/WixContext/WixContext";
import Cookies from "js-cookie";
import { currentCart } from "@wix/ecom"; 
 
type CartState = {
  cart: currentCart.Cart;
  isLoading: boolean;
  counter: number;
  getCart: (wixClient: WixClient) => void;
  addItem: (
    wixClient: WixClient,
    productId: string,
    variantId: string,
    quantity: number
  ) => void;
  removeItem: (wixClient: WixClient, itemId: string) => void;
};
    

export const useCartStore = create((set) => ({
    
    cart:[],
    isLoading:true,
    counter:0,

     getCart: async (wixClient) => {
      //  const refreshToken = Cookies.get('refreshToken'); // Ensure refreshToken exists in cookies
         
        /*if (!refreshToken) {
            console.warn("No refresh token found. Reinitializing session...");
            set({ cart: [], isLoading: false, counter: 0 });  // If no refresh token, reset the cart
            return;
        }*/

        try {
            // Fetch the current cart
            const cart = await wixClient.currentCart.getCurrentCart();
            set({ cart, isLoading: false, counter: cart?.lineItems?.length || 0 });
        } catch (e) {
            console.warn("Cart not found, creating new one implicitly...");
            set({ cart: [], isLoading: false, counter: 0 });  // Handle failure to fetch cart
        }
    },


            
    addItem: async (wixClient, productId,variantId,quantity)=>{

        set((state)=>({...state, isLoading:true}))
        const response = await wixClient.currentCart.addToCurrentCart({
            lineItems:[{
                catalogReference:{
                    appId:process.env.NEXT_PUBLIC_WIX_APP_ID,
                    catalogItemId:productId,
                    ...(variantId && {options:{variantId}})
                },
                quantity:quantity
            }]
        });
        set({
            cart: response.cart,
            counter:response.cart?.lineItems.length,
            isLoading:false
        })

    },
    removeItem: async (wixClient,itemId)=>{
        set((state)=>({...state, isLoading:true}))
        const response = await wixClient.currentCart.removeLineItemsFromCurrentCart(
            [itemId]
          );
        
        set({
            cart: response.cart,
            counter:response.cart?.lineItems.length,
            isLoading:false
        })
    },
    updateQuantity: async (wixClient, itemId, newQuantity) => {
        set((state) => ({ ...state, isLoading: true }));
        const response = await wixClient.currentCart.updateCurrentCartLineItemQuantity([
          {
            id: itemId, // Ensure this is the correct identifier for the item
            quantity: newQuantity,
          },
        ]);
        set({
          cart: response.cart,
          counter: response.cart?.lineItems.length,
          isLoading: false,
        });
      },
}))
