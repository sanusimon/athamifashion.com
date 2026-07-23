import { createClient, ApiKeyStrategy, OAuthStrategy } from "@wix/sdk";
import { products, collections } from "@wix/stores";
import { items } from "@wix/data";
import { orders } from "@wix/ecom";
import { members } from "@wix/members";

const normalizeRefreshToken = (refreshToken) => {
  if (!refreshToken) return undefined;

  return typeof refreshToken === "string"
    ? { value: refreshToken }
    : refreshToken;
};

/**
 * Visitor / logged-in member
 */
const buildOAuthClient = (refreshToken) => {
  return createClient({
    modules: {
      products,
      collections,
      orders,
      members,
      items,
    },
    auth: OAuthStrategy({
      clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID,
      tokens: {
        refreshToken: normalizeRefreshToken(refreshToken),
        accessToken: {
          value: "",
          expiresAt: 0,
        },
      },
    }),
  });
};

/**
 * Server Admin Client
 * Uses API Key
 */
const buildApiKeyClient = () => {
  return createClient({
    modules: {
      products,
      collections,
      orders,
      members,
      items,
    },
    auth: ApiKeyStrategy({
      apiKey: process.env.WIX_API_KEY,
      siteId: process.env.WIX_SITE_ID,
      // accountId: process.env.WIX_ACCOUNT_ID, // optional
    }),
  });
};

const wixClientServer = async (refreshToken) => {
  // Logged-in customer
  if (refreshToken) {
    return buildOAuthClient(refreshToken);
  }

  // Server-side admin
  if (
    process.env.WIX_API_KEY &&
    process.env.WIX_SITE_ID
  ) {
    return buildApiKeyClient();
  }

  throw new Error(
    "Missing WIX_API_KEY or WIX_SITE_ID"
  );
};
export default wixClientServer;