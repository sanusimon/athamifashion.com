import { createClient, OAuthStrategy } from "@wix/sdk";
import { products, collections } from "@wix/stores";
import { orders } from "@wix/ecom";
import { members } from "@wix/members";

export const wixClientServer = async (refreshToken) => {
  const token = refreshToken || process.env.WIX_REFRESH_TOKEN || "";

  const wixClient = createClient({
    modules: {
      products,
      collections,
      orders,
      members,
    },
    auth: OAuthStrategy({
      clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID,
      tokens: {
        refreshToken: token,
        accessToken: { value: "", expiresAt: 0 },
      },
    }),
  });

  return wixClient;
};
