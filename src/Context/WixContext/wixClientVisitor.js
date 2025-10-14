import { createClient, OAuthStrategy } from '@wix/sdk';
import { currentCart } from '@wix/ecom';
import Cookies from 'js-cookie';

let refreshToken = {};
if (typeof window !== 'undefined') {
  try {
    const storedToken = Cookies.get('refreshToken');
    refreshToken = storedToken ? JSON.parse(storedToken) : {};
  } catch (err) {
    console.error('Invalid refresh token in cookie:', err);
    refreshToken = {};
    Cookies.remove('refreshToken');
  }
}

export const wixClientVisitor = createClient({
  modules: { currentCart },
  auth: OAuthStrategy({
    clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID,
    tokens: {
      refreshToken,
      accessToken: { value: '', expiresAt: 0 },
    },
    onTokens: (tokens) => {
      if (tokens?.refreshToken) {
        Cookies.set('refreshToken', JSON.stringify(tokens.refreshToken), {
          path: '/',
          secure: true,
          sameSite: 'Lax',
          expires: 30,
        });
      }
    },
  }),
});
