import { create } from 'zustand';
import Cookies from "js-cookie";

export const useCartStore = create((set) => ({
  cart: [],
  isLoading: true,
  counter: 0,

  loadCartFromStorage: () => {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    const savedCounter = savedCart?.lineItems?.length || 0;
    set({ cart: savedCart, counter: savedCounter });
  },

  getCart: async (wixClient) => {
    const refreshToken = Cookies.get('refreshToken');
    if (!refreshToken) {
      console.warn("No refresh token found. Resetting session...");
      set({ cart: [], isLoading: false, counter: 0 });
      return;
    }

    try {
      const cart = await wixClient.currentCart.getCurrentCart();
      set({ cart, isLoading: false, counter: cart?.lineItems?.length || 0 });
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) {
      console.error("❌ Failed to fetch cart:", e);

      // Optional: clear bad token if authentication failed
      if (e?.status === 401 || e?.message?.includes("unauthorized")) {
        Cookies.remove("refreshToken");
        console.warn("Removed invalid refresh token.");
      }

      set({ cart: [], isLoading: false, counter: 0 });
    }
  },

  addItem: async (wixClient, productId, variantId, quantity) => {
    set({ isLoading: true });
    try {
      const response = await wixClient.currentCart.addToCurrentCart({
        lineItems: [{
          catalogReference: {
            appId: process.env.NEXT_PUBLIC_WIX_APP_ID,
            catalogItemId: productId,
            ...(variantId && { options: { variantId } })
          },
          quantity
        }]
      });
      set({
        cart: response.cart,
        counter: response.cart?.lineItems.length,
        isLoading: false
      });
      localStorage.setItem('cart', JSON.stringify(response.cart));
    } catch (e) {
      console.error("❌ Failed to add item to cart:", e);
      set({ isLoading: false });
    }
  },

  removeItem: async (wixClient, itemId) => {
    set({ isLoading: true });
    try {
      const response = await wixClient.currentCart.removeLineItemsFromCurrentCart([itemId]);
      set({
        cart: response.cart,
        counter: response.cart?.lineItems.length,
        isLoading: false
      });
      localStorage.setItem('cart', JSON.stringify(response.cart));
    } catch (e) {
      console.error("❌ Failed to remove item from cart:", e);
      set({ isLoading: false });
    }
  },

  updateQuantity: async (wixClient, itemId, newQuantity) => {
    set({ isLoading: true });
    try {
      const response = await wixClient.currentCart.updateCurrentCartLineItemQuantity([
        { id: itemId, quantity: newQuantity }
      ]);
      set({
        cart: response.cart,
        counter: response.cart?.lineItems.length,
        isLoading: false
      });
      localStorage.setItem('cart', JSON.stringify(response.cart));
    } catch (e) {
      console.error("❌ Failed to update cart quantity:", e);
      set({ isLoading: false });
    }
  },
}));
