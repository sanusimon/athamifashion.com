const wixClient = createClient({
    modules: { auth },
    authStrategy: oAuthStrategy({
      clientId: '1306cf60-8f77-400a-8c33-7fa13dfbe4b4',
      redirectUri: process.env.NEXT_PUBLIC_WIX_REDIRECT_URI || 'http://localhost:3000/oauth/callback',
    }),
  });
  