import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { ethers } from 'ethers';
import { CredentialStore } from './store.js';
import { hashPassword, verifyPassword, registrationError } from './passwords.js';
import { passwordError } from '../utils/passwordPolicy.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const token = () => randomBytes(32).toString('hex');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const equal = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};
const genericFailure = 'Unable to authenticate with the supplied credentials.';

export async function createApp({
  origin = process.env.APP_ORIGIN || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5173,http://localhost:3000'),
  storeFile = path.join(root, '.auth-data', 'users.json'),
  secureCookies = process.env.NODE_ENV === 'production',
  now = Date.now,
  ipLimit = 120,
  accountLimit = 10,
} = {}) {
  if (!origin) throw new Error('APP_ORIGIN must specify an HTTPS origin in production.');
  const expectedOrigins = new Set(origin.split(',').map((value) => new URL(value.trim()).origin));
  if (secureCookies && [...expectedOrigins].some((value) => !value.startsWith('https://'))) throw new Error('APP_ORIGIN must use HTTPS in production.');
  const store = new CredentialStore(storeFile);
  const app = express();
  const contexts = new Map();
  const challenges = new Map();
  const sessions = new Map();
  const attempts = new Map();
  const dummyHash = await hashPassword(token());
  const contextCookie = secureCookies ? '__Host-blockauth-context' : 'blockauth-context';
  const sessionCookie = secureCookies ? '__Host-blockauth-session' : 'blockauth-session';
  const cookieOptions = { httpOnly: true, secure: secureCookies, sameSite: 'strict', path: '/' };
  let activeHashes = 0;

  function readCookie(req, name) {
    return (req.headers.cookie || '').split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1);
  }
  function cookieKey(req, name) {
    const value = readCookie(req, name);
    return /^[a-f0-9]{64}$/.test(value || '') ? digest(value) : '';
  }
  function limited(key, maximum) {
    const item = attempts.get(key);
    if (!item || item.expires <= now()) attempts.set(key, { count: 1, expires: now() + 15 * 60_000 });
    else item.count++;
    return attempts.get(key).count > maximum;
  }
  function clean() {
    for (const map of [contexts, challenges, attempts]) {
      for (const [key, value] of map) if (value.expires <= now()) map.delete(key);
    }
    for (const [key, value] of sessions) {
      if (value.expires <= now() || value.lastSeen + 15 * 60_000 <= now()) sessions.delete(key);
    }
  }
  function requireSession(req, res, next) {
    const session = sessions.get(cookieKey(req, sessionCookie));
    if (!session || session.expires <= now() || session.lastSeen + 15 * 60_000 <= now()) {
      return res.status(401).json({ error: 'Please log in.' });
    }
    session.lastSeen = now();
    req.auth = session;
    next();
  }
  function issueSession(req, res, address) {
    sessions.delete(cookieKey(req, sessionCookie));
    const value = token();
    sessions.set(digest(value), { address, lastSeen: now(), expires: now() + 8 * 60 * 60_000 });
    res.cookie(sessionCookie, value, { ...cookieOptions, maxAge: 8 * 60 * 60_000 });
  }
  function asyncRoute(handler) {
    return (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
  }

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    });
    if (secureCookies) res.set('Strict-Transport-Security', 'max-age=31536000');
    next();
  });
  app.use('/api', (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    if (secureCookies && !req.secure) return res.status(426).json({ error: 'HTTPS is required.' });
    next();
  });
  app.use(express.json({ limit: '8kb' }));
  app.get('/api/hello', (req, res) => res.json({ message: 'Hello from Express backend!' }));

  app.use('/api/auth', (req, res, next) => {
    clean();
    if (attempts.size >= 10_000 || limited(`ip:${req.ip}`, ipLimit)) {
      res.set('Retry-After', '900');
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const context = contexts.get(cookieKey(req, contextCookie));
      if (!expectedOrigins.has(req.headers.origin) || req.headers['sec-fetch-site'] === 'cross-site' ||
          !context || !equal(req.headers['x-csrf-token'], context.csrf)) {
        return res.status(403).json({ error: 'Invalid request origin or CSRF token. Refresh and try again.' });
      }
      if (!req.is('application/json')) return res.status(415).json({ error: 'JSON is required.' });
      req.contextKey = cookieKey(req, contextCookie);
    }
    next();
  });

  app.get('/api/auth/csrf', (req, res) => {
    let context = contexts.get(cookieKey(req, contextCookie));
    if (!context) {
      if (contexts.size >= 10_000) return res.status(503).json({ error: 'Please try again later.' });
      const value = token();
      context = { csrf: token(), expires: now() + 30 * 60_000 };
      contexts.set(digest(value), context);
      res.cookie(contextCookie, value, { ...cookieOptions, maxAge: 30 * 60_000 });
    }
    res.json({ csrfToken: context.csrf });
  });

  app.post('/api/auth/challenge', (req, res) => {
    const { address, purpose } = req.body || {};
    if (!ethers.utils.isAddress(address || '') || !['register', 'login'].includes(purpose)) {
      return res.status(400).json({ error: 'A valid wallet and authentication purpose are required.' });
    }
    if (challenges.size >= 10_000) return res.status(503).json({ error: 'Please try again later.' });
    const normalizedAddress = address.toLowerCase();
    const id = token();
    const expires = now() + 5 * 60_000;
    const message = `BlockAuth ${purpose}\nOrigin: ${req.headers.origin}\nWallet: ${normalizedAddress}\nNonce: ${token()}\nExpires: ${new Date(expires).toISOString()}\nThis signature authorizes only this authentication request.`;
    challenges.set(id, { address: normalizedAddress, purpose, message, contextKey: req.contextKey, origin: req.headers.origin, expires });
    res.json({ challengeId: id, message });
  });

  for (const purpose of ['register', 'login']) {
    app.post(`/api/auth/${purpose}`, asyncRoute(async (req, res) => {
      const { challengeId, signature, password } = req.body || {};
      const challenge = typeof challengeId === 'string' ? challenges.get(challengeId) : undefined;
      if (!challenge || challenge.expires <= now() || challenge.purpose !== purpose || challenge.contextKey !== req.contextKey || challenge.origin !== req.headers.origin) {
        return res.status(401).json({ error: genericFailure });
      }
      // Consume before awaiting anything: a challenge can be tried only once.
      challenges.delete(challengeId);
      try {
        if (typeof signature !== 'string' || ethers.utils.verifyMessage(challenge.message, signature).toLowerCase() !== challenge.address) {
          return res.status(401).json({ error: genericFailure });
        }
      } catch {
        return res.status(401).json({ error: genericFailure });
      }
      // Only verified wallet owners can spend an account's authentication budget.
      // Unauthenticated challenge requests cannot lock out somebody else's wallet.
      if (limited(`account:${challenge.address}`, accountLimit)) {
        res.set('Retry-After', '900');
        return res.status(429).json({ error: 'Too many authentication attempts. Please try again later.' });
      }
      const error = purpose === 'register' ? registrationError(password) : passwordError(password);
      if (error) return res.status(400).json({ error });
      if (activeHashes >= 4 || sessions.size >= 10_000) return res.status(503).json({ error: 'Please try again later.' });
      activeHashes++;
      try {
        if (purpose === 'register') {
          const passwordHash = await hashPassword(password);
          if (!contexts.has(req.contextKey) || challenge.expires <= now()) return res.status(401).json({ error: genericFailure });
          if (!store.create(challenge.address, passwordHash)) {
            return res.status(409).json({ error: 'Unable to register with the supplied credentials.' });
          }
          // Registration is not a login: require the password again to start a session.
          return res.status(201).json({ registered: true });
        }
        const user = store.get(challenge.address);
        const verified = await verifyPassword(user?.passwordHash || dummyHash, password);
        if (user) store.record(challenge.address, verified, new Date(now()).toISOString());
        if (!user || !verified) return res.status(401).json({ error: genericFailure });
        if (!contexts.has(req.contextKey) || challenge.expires <= now()) return res.status(401).json({ error: genericFailure });
        issueSession(req, res, challenge.address);
        return res.json({ address: challenge.address });
      } finally {
        activeHashes--;
      }
    }));
  }

  app.get('/api/auth/session', requireSession, (req, res) => res.json({ address: req.auth.address }));
  app.get('/api/auth/history', requireSession, (req, res) => res.json({ events: store.get(req.auth.address)?.history || [] }));
  app.post('/api/auth/logout', (req, res) => {
    sessions.delete(cookieKey(req, sessionCookie));
    contexts.delete(req.contextKey);
    for (const [id, challenge] of challenges) if (challenge.contextKey === req.contextKey) challenges.delete(id);
    res.clearCookie(contextCookie, cookieOptions);
    res.clearCookie(sessionCookie, cookieOptions);
    res.json({ loggedOut: true });
  });
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));
  app.use(express.static(path.join(root, 'dist'), { dotfiles: 'deny' }));
  app.get('*', (req, res) => res.sendFile(path.join(root, 'dist', 'index.html')));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const malformed = error.type === 'entity.parse.failed';
    const tooLarge = error.type === 'entity.too.large';
    res.status(tooLarge ? 413 : malformed ? 400 : 500).json({ error: tooLarge ? 'Request is too large.' : malformed ? 'Invalid JSON.' : 'Request could not be completed.' });
  });
  return app;
}
