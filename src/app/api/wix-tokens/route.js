import { createClient, OAuthStrategy } from "@wix/sdk";

export async function GET() {
  const wixClient = createClient({
    auth: OAuthStrategy({
      clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID
    })
  });

  const tokens = await wixClient.auth.generateVisitorTokens();

  return Response.json(tokens);
  
}
