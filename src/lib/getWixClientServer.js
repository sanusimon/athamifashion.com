import { createClient, OAuthStrategy } from "@wix/sdk";
import { products, collections } from "@wix/stores";
import { cookies } from require('next/headers').cookies()  // ✅ This is fine in a server file

export const getWixClient = () => {
    let refreshToken = null;
    
    try {
        const cookiesStore = cookies(); // ✅ This works only in a server file
        refreshToken = JSON.parse(cookiesStore.get("refreshToken")?.value || "{}");    
    } catch (err) {
        console.error("Error reading cookies:", err);
    }

    const wixClient = createClient({
        modules: { products, collections },
        auth: OAuthStrategy({
            clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID,
            tokens: {
                refreshToken,
                accessToken: { value: "", expiresAt: 0 }
            },
        }),
    });

    return wixClient;
};
