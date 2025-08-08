import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WixClient } from "@/Context/WixContext/WixContext";
import { useWixClient } from "@/hooks/useWixClient";
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
            counter: cart?.lineItems.length || 0,
          });
        } catch (err) {
          set((prev) => ({ ...prev, isLoading: false }));
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
          counter: response.cart?.lineItems.length,
          isLoading: false,
        });
      },

      removeItem: async (wixClient, itemId) => {
        set({ isLoading: true });
        const response = await wixClient.currentCart.removeLineItemsFromCurrentCart([itemId]);
        set({
          cart: response.cart,
          counter: response.cart?.lineItems.length,
          isLoading: false,
        });
      },

      updateQuantity: async (wixClient, itemId, newQuantity) => {
        set({ isLoading: true });
        const wixClint = useWixClient();
        const response = await wixClint.currentCart.updateCurrentCartLineItemQuantity([
          { id: itemId, quantity: newQuantity },
        ]);
        set({
          cart: response.cart,
          counter: response.cart?.lineItems.length,
          isLoading: false,
        });
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
