// /app/api/set-token/route.js or .ts (depending on your setup)

import { NextResponse } from "next/server";

export async function POST(req) {
  const body = await req.json();
  const { refreshToken } = body;

  const response = NextResponse.json({ success: true });
  response.cookies.set("refreshToken", JSON.stringify(refreshToken), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 2, // 2 days
  });

  return response;
}
