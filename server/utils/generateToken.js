const jwt = require('jsonwebtoken');

// Signs a JWT for a given user document. Includes tokenVersion so that
// bumping User.tokenVersion (e.g. on password change) instantly invalidates
// every previously-issued token for that user, even though JWTs are
// otherwise stateless.
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, tokenVersion: user.tokenVersion || 0 },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const COOKIE_NAME = 'teamflow_token';

// Sets the JWT as an httpOnly cookie so it can't be read or exfiltrated by
// client-side JS (mitigates token theft via XSS). The token is also still
// returned in the JSON body for the socket.io handshake and for API
// clients/tools that don't support cookies (e.g. Postman, mobile).
const setTokenCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, matches default JWT_EXPIRE
    path: '/',
  });
};

const clearTokenCookie = (res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
};

module.exports = { generateToken, setTokenCookie, clearTokenCookie, COOKIE_NAME };
