const wixClient = createClient({
  modules: { auth },
  authStrategy: oAuthStrategy({
    clientId: '<your-client-id>',
    redirectUri: process.env.NEXT_PUBLIC_WIX_REDIRECT_URI || 'http://localhost:3000/oauth/callback',
  }),
});
