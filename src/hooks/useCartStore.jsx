import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WixClient } from "@/Context/WixContext/WixContext";
import { useWixClient } from "./useWixClient";
import { currentCart } from "@wix/ecom";

// type CartState = {
//   cart: any;
//   isLoading: boolean;
//   counter: number;
//   getCart: (wixClient: WixClient) => void;
//   addItem: (wixClient: WixClient, productId: string, variantId: string, quantity: number) => void;
//   removeItem: (wixClient: WixClient, itemId: string) => void;
//   updateQuantity: (wixClient: WixClient, itemId: string, newQuantity: number) => void;
// };

export const useCartStore = create()(
  persist(
    (set, get) => ({
      cart: [],
      isLoading: true,
      counter: 0,

     getCart: async (wixClient) => {
  try {
    const cart = await wixClient.currentCart.getCurrentCart();

    set({
      cart: cart || [],
      isLoading: false,
      counter: cart?.lineItems?.length || 0,
    });

  } catch (err) {
    const errorCode = err?.details?.applicationError?.code;

    if (errorCode === "OWNED_CART_NOT_FOUND") {
      console.warn("No Wix cart found. Rehydrating from persisted local cart...");

      // 🔁 Recover from persisted local cart (Zustand)
      const localCart = get().cart;

      // If local cart has line items, re-add them to recreate Wix cart
      if (localCart?.lineItems?.length > 0) {
        try {
          const response = await wixClient.currentCart.addToCurrentCart({
            lineItems: localCart.lineItems.map((item) => ({
              catalogReference: {
                appId: process.env.NEXT_PUBLIC_WIX_APP_ID,
                catalogItemId: item.catalogReference.catalogItemId,
                ...(item.catalogReference.options && {
                  options: item.catalogReference.options,
                }),
              },
              quantity: item.quantity,
            })),
          });

          set({
            cart: response.cart,
            isLoading: false,
            counter: response.cart?.lineItems.length || 0,
          });
        } catch (rehydrationError) {
          console.error("Failed to rehydrate cart from local storage:", rehydrationError);
          set({ cart: [], isLoading: false, counter: 0 });
        }
      } else {
        // No local cart either
        set({ cart: [], isLoading: false, counter: 0 });
      }

    } else {
      console.error("getCart() failed:", err);
      set({ isLoading: false });
    }
  }
},




      addItem: async (wixClient, productId, variantId, quantity) => {
        set({ isLoading: true });
        const response = await wixClient.currentCart.addToCurrentCart({
          lineItems: [
            {
              catalogReference: {
                appId: process.env.NEXT_PUBLIC_WIX_APP_ID,
                catalogItemId: productId,
                ...(variantId && { options: { variantId } }),
              },
              quantity,
            },
          ],
        });
        set({
          cart: response.cart,
          counter: (response.cart?.lineItems.length),
          isLoading: false,
        });
      },
       updateQuantity: async (wixClient, itemId, newQuantity) => {
        set({ isLoading: true });
        try {
          const existingCart = await wixClient.currentCart.getCurrentCart();
          if (!existingCart || !existingCart.lineItems || existingCart.lineItems.length === 0) {
            console.warn("No cart exists. Cannot update quantity.");
            return;
          }

          const response = await wixClient.currentCart.updateCurrentCartLineItemQuantity([
            { id: itemId, quantity: newQuantity },
          ]);

          set({
            cart: response.cart,
            counter: (response.cart?.lineItems.length),
            isLoading: false,
          });
        } catch (err) {
          console.error("updateQuantity error:", err);
          set({ isLoading: false });
        }
      },


      removeItem: async (wixClient, itemId) => {
      try {
        set({ isLoading: true });
        const response = await wixClient.currentCart.removeLineItemsFromCurrentCart([itemId]);
        set({
          cart: response.cart,
          counter: (response.cart?.lineItems.length),
          isLoading: false,
        });
      } catch (err) {
        console.error("Remove item failed:", err);
        set({ isLoading: false });
      }
    },


     
    }),
    {
      name: 'cart-storage', // localStorage key
      partialize: (state) => ({
        cart: state.cart,
        counter: state.counter,
      }),
    }
  )
);
