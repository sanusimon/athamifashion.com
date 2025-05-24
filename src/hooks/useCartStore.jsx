import { create } from 'zustand';
import { WixClient } from "@/Context/WixContext/WixContext"; // Ensure this is the correct import for WixClient
import Cookies from "js-cookie";

export const useCartStore = create((set) => ({
    cart: [],
    isLoading: true,
    counter: 0,

    // Function to load cart from localStorage if available
    loadCartFromStorage: () => {
        const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
        const savedCounter = savedCart?.lineItems?.length || 0;
        set({ cart: savedCart, counter: savedCounter });
    },

    // Fetch the current cart from Wix
    getCart: async (wixClient) => {
        const refreshToken = Cookies.get('refreshToken'); // Check if refreshToken exists in cookies
        if (!refreshToken) {
            console.warn("No refresh token found. Reinitializing session...");
            
            // Fallback to loading cart from localStorage if no refresh token
            const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
            set({ cart: savedCart, counter: savedCart?.lineItems?.length || 0, isLoading: false });

            // Optionally, you can prompt the user to log in here.
            return;
        }

        try {
            // Fetch the current cart from Wix API
            const cart = await wixClient.currentCart.getCurrentCart();
            set({ cart, isLoading: false, counter: cart?.lineItems?.length || 0 });

            // Persist cart data in localStorage
            localStorage.setItem('cart', JSON.stringify(cart));

        } catch (e) {
            console.warn("Cart not found, creating new one implicitly...");
            set({ cart: [], isLoading: false, counter: 0 });

            // Optionally, create a new cart (no Wix data), and store it in localStorage
            localStorage.setItem('cart', JSON.stringify([]));
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

        // Update cart state and persist to localStorage
        set({
            cart: response.cart,
            counter: response.cart?.lineItems.length,
            isLoading: false
        });

        // Save updated cart to localStorage
        localStorage.setItem('cart', JSON.stringify(response.cart));
    },

    // Remove item from the cart
    removeItem: async (wixClient, itemId) => {
        set((state) => ({ ...state, isLoading: true }));

        const response = await wixClient.currentCart.removeLineItemsFromCurrentCart([itemId]);

        // Update cart state and persist to localStorage
        set({
            cart: response.cart,
            counter: response.cart?.lineItems.length,
            isLoading: false
        });

        // Save updated cart to localStorage
        localStorage.setItem('cart', JSON.stringify(response.cart));
    },

    // Update item quantity in the cart
    updateQuantity: async (wixClient, itemId, newQuantity) => {
        set((state) => ({ ...state, isLoading: true }));

        const response = await wixClient.currentCart.updateCurrentCartLineItemQuantity([
            { id: itemId, quantity: newQuantity }
        ]);

        // Update cart state and persist to localStorage
        set({
            cart: response.cart,
            counter: response.cart?.lineItems.length,
            isLoading: false
        });

        // Save updated cart to localStorage
        localStorage.setItem('cart', JSON.stringify(response.cart));
    },
}));
