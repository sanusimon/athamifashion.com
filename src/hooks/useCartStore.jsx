import { create } from 'zustand';
import { WixClient } from "@/Context/WixContext/WixContext";
import Cookies from "js-cookie";

export const useCartStore = create((set) => ({
    cart: [],
    isLoading: true,
    counter: 0,

    // Function to load cart from localStorage (if available)
    loadCartFromStorage: () => {
        const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
        const savedCounter = savedCart?.lineItems?.length || 0;
        set({ cart: savedCart, counter: savedCounter });
    },

    // Fetch the current cart from Wix
    getCart: async (wixClient) => {
        const refreshToken = Cookies.get('refreshToken'); // Ensure refreshToken exists in cookies
        if (!refreshToken) {
            console.warn("No refresh token found. Reinitializing session...");
            set({ cart: [], isLoading: false, counter: 0 });  // If no refresh token, reset the cart
            return;
        }

        try {
            // Fetch the current cart
            const cart = await wixClient.currentCart.getCurrentCart();
            set({ cart, isLoading: false, counter: cart?.lineItems?.length || 0 });

            // Persist cart in localStorage
            localStorage.setItem('cart', JSON.stringify(cart));

        } catch (e) {
            console.warn("Cart not found, creating new one implicitly...");
            set({ cart: [], isLoading: false, counter: 0 });  // Handle failure to fetch cart
        }
    },

    // Add item to the cart
    addItem: async (wixClient, productId, variantId, quantity) => {
        set((state) => ({ ...state, isLoading: true }));
        const response = await wixClient.currentCart.addToCurrentCart({
            lineItems: [{
                catalogReference: {
                    appId: process.env.NEXT_PUBLIC_WIX_APP_ID,
                    catalogItemId: productId,
                    ...(variantId && { options: { variantId } })
                },
                quantity: quantity
            }]
        });

        // Update state and persist to localStorage
        set({
            cart: response.cart,
            counter: response.cart?.lineItems.length,
            isLoading: false
        });

        localStorage.setItem('cart', JSON.stringify(response.cart));
    },

    // Remove item from the cart
    removeItem: async (wixClient, itemId) => {
        set((state) => ({ ...state, isLoading: true }));
        const response = await wixClient.currentCart.removeLineItemsFromCurrentCart([itemId]);

        // Update state and persist to localStorage
        set({
            cart: response.cart,
            counter: response.cart?.lineItems.length,
            isLoading: false
        });

        localStorage.setItem('cart', JSON.stringify(response.cart));
    },

    // Update item quantity in the cart
    updateQuantity: async (wixClient, itemId, newQuantity) => {
        set((state) => ({ ...state, isLoading: true }));
        const response = await wixClient.currentCart.updateCurrentCartLineItemQuantity([
            { id: itemId, quantity: newQuantity }
        ]);

        // Update state and persist to localStorage
        set({
            cart: response.cart,
            counter: response.cart?.lineItems.length,
            isLoading: false
        });

        localStorage.setItem('cart', JSON.stringify(response.cart));
    },
}));
