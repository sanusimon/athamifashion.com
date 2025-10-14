// wixClientMember.ts
"use client";

import { createClient, OAuthStrategy } from "@wix/sdk";
import { products, collections } from "@wix/stores";
import { currentCart } from "@wix/ecom";
import { members } from "@wix/members";
import { redirects } from "@wix/redirects";
import Cookies from "js-cookie";

let refreshToken = {};
if (typeof window !== "undefined") {
  try {
    const storedToken = Cookies.get("refreshToken");
    refreshToken = storedToken ? JSON.parse(storedToken) : {};
  } catch (err) {
    console.error("Invalid refresh token in cookie:", err);
    refreshToken = {};
    Cookies.remove("refreshToken");
  }
}

export const wixClientMember = createClient({
  modules: {
    products,
    collections,
    currentCart,
    members,
    redirects,
  },
  auth: OAuthStrategy({
    clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID,
    tokens: {
      refreshToken,
      accessToken: { value: "", expiresAt: 0 },
    },
    onTokens: (tokens) => {
      if (tokens?.refreshToken) {
        Cookies.set("refreshToken", JSON.stringify(tokens.refreshToken), {
          expires: 30,
          secure: true,
          sameSite: "Lax",
          path: "/",
        });
      }
    },
  }),
});
