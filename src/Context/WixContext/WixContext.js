"use client";

import { createClient, OAuthStrategy } from "@wix/sdk";
import { products, collections } from "@wix/stores";
import { currentCart } from "@wix/ecom";
import Cookies from "js-cookie";
import { createContext } from "react";
import { redirects } from "@wix/redirects";
import { members } from "@wix/members";
let refreshToken = {};
if (typeof window !== "undefined") {
    try {
        const storedToken = Cookies.get("refreshToken");
        refreshToken = storedToken ? JSON.parse(storedToken) : {};
    } catch (err) {
        console.error("Invalid refresh token:", err);
        refreshToken = {};
    }
}

const wixClient = createClient({
  modules: {
    products,
    collections,
    currentCart,
    redirects,
    members,
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
          path: "/", // ✅ ensure it's accessible everywhere
        });
      }
    }
  }),
});

export const WixClientContext = createContext();

export const WixClientContextProvider = ({ children }) => {
  return (
    <WixClientContext.Provider value={wixClient}>
      {children}
    </WixClientContext.Provider>
  );
};
