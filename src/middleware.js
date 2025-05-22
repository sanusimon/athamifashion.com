import { createClient, OAuthStrategy } from "@wix/sdk"
import { NextRequest, NextResponse } from "next/server"

export const middleware = async (request) =>{
    
    const cookies = request.cookies
    const res = NextResponse.next()

    if(cookies.get("refreshToken")){
        return res
    }

    const wixClient = createClient({
        auth:OAuthStrategy({clientId:process.env.NEXT_PUBLIC_WIX_CLIENT_ID})
    })

    const tokens = await wixClient.auth.generateVisitorTokens()
    res.cookies.set("refreshToken", JSON.stringify(tokens.refreshToken), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30,
      });
      
    return res
}