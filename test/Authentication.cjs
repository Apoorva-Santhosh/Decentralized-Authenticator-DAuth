const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ethers } = require('ethers');

const ORIGIN = 'http://localhost:5173';
const PASSWORD = 'A river of violet stars 42';

describe('OWASP-aligned password API', function () {
  this.timeout(15000);
  let createApp, directory, filename, server, base, clock, client, wallet;
  let accountLimit, ipLimit;

  class Client {
    constructor() { this.cookies = new Map(); this.csrf = ''; }
    async request(endpoint, { method = 'GET', body, headers = {} } = {}) {
      const response = await fetch(`${base}${endpoint}`, {
        method,
        headers: { Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; '),
          ...(method !== 'GET' ? { Origin: ORIGIN, 'Content-Type': 'application/json', 'X-CSRF-Token': this.csrf } : {}), ...headers },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      const cookies = response.headers.getSetCookie?.() || (response.headers.get('set-cookie') || '').split(/,(?=\s*[^;,=]+=)/);
      for (const cookie of cookies) {
        if (!cookie) continue;
        const [name, value] = cookie.split(';')[0].split('=');
        if (value) this.cookies.set(name.trim(), value);
        else this.cookies.delete(name.trim());
      }
      const data = await response.json();
      return { status: response.status, data, headers: response.headers };
    }
    async ready() {
      const response = await this.request('/api/auth/csrf');
      this.csrf = response.data.csrfToken;
      return this;
    }
    async challenge(user, purpose) {
      await this.ready();
      const result = await this.request('/api/auth/challenge', { method: 'POST', body: { address: user.address, purpose } });
      assert.equal(result.status, 200, JSON.stringify(result.data));
      return result.data;
    }
    async authenticate(user, purpose, password) {
      const challenge = await this.challenge(user, purpose);
      return this.request(`/api/auth/${purpose}`, { method: 'POST', body: {
        challengeId: challenge.challengeId,
        signature: await user.signMessage(challenge.message),
        password,
      } });
    }
  }

  async function start(options = {}) {
    const app = await createApp({ origin: ORIGIN, storeFile: filename, now: () => clock, secureCookies: false, accountLimit, ipLimit, ...options });
    server = await new Promise((resolve) => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)); });
    base = `http://127.0.0.1:${server.address().port}`;
  }
  async function stop() {
    const instance = server;
    server = undefined;
    if (!instance) return;
    await new Promise((resolve, reject) => {
      instance.close((error) => error ? reject(error) : resolve());
      instance.closeAllConnections();
    });
  }
  async function registerAndLogin(user = wallet, password = PASSWORD, browser = client) {
    assert.equal((await browser.authenticate(user, 'register', password)).status, 201);
    assert.equal((await browser.authenticate(user, 'login', password)).status, 200);
  }
  before(async function () { ({ createApp } = await import('../server/app.js')); });
  beforeEach(async function () {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'blockauth-tests-'));
    filename = path.join(directory, 'users.json');
    clock = Date.now();
    accountLimit = 10;
    ipLimit = 120;
    wallet = ethers.Wallet.createRandom();
    await start();
    client = await new Client().ready();
  });
  afterEach(async function () {
    await stop();
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('blockauth-tests-'));
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('protects session and private history endpoints without authentication', async function () {
    for (const endpoint of ['session', 'history']) assert.equal((await client.request(`/api/auth/${endpoint}`)).status, 401);
  });
  it('stores only a salted Argon2id verifier and requires login after registration', async function () {
    const result = await client.authenticate(wallet, 'register', PASSWORD);
    assert.equal(result.status, 201);
    assert.equal((await client.request('/api/auth/session')).status, 401);
    const text = fs.readFileSync(filename, 'utf8');
    assert.ok(!text.includes(PASSWORD));
    const user = JSON.parse(text).users[wallet.address.toLowerCase()];
    assert.match(user.passwordHash, /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    assert.ok(!JSON.stringify(result.data).includes('passwordHash'));
    const other = ethers.Wallet.createRandom();
    assert.equal((await client.authenticate(other, 'register', PASSWORD)).status, 201);
    const users = JSON.parse(fs.readFileSync(filename, 'utf8')).users;
    assert.notEqual(users[wallet.address.toLowerCase()].passwordHash, users[other.address.toLowerCase()].passwordHash);
  });
  it('requires wallet proof and the correct password to establish a session', async function () {
    await registerAndLogin();
    const result = await client.request('/api/auth/session');
    assert.equal(result.status, 200);
    assert.equal(result.data.address, wallet.address.toLowerCase());
    assert.equal(result.headers.get('cache-control'), 'no-store');
    const history = await client.request('/api/auth/history');
    assert.deepEqual(history.data.events.map((event) => event.success), [true]);
    assert.ok(!JSON.stringify(history.data).includes('password'));
  });
  it('returns the same login failure for an unknown account and a wrong password', async function () {
    assert.equal((await client.authenticate(wallet, 'register', PASSWORD)).status, 201);
    const wrong = await client.authenticate(wallet, 'login', 'incorrect password');
    const missing = await client.authenticate(ethers.Wallet.createRandom(), 'login', PASSWORD);
    assert.equal(wrong.status, 401);
    assert.deepEqual(wrong.data, missing.data);
    assert.equal(missing.status, 401);
    assert.equal((await client.request('/api/auth/session')).status, 401);
  });
  it('rejects short, oversized, and common passwords on the server', async function () {
    for (const password of ['short', 'a'.repeat(129), 'passwordpassword', '    password    ']) {
      assert.equal((await client.authenticate(wallet, 'register', password)).status, 400);
    }
    assert.ok(!fs.existsSync(filename));
  });
  it('accepts Unicode and spaces and preserves significant whitespace', async function () {
    const password = '  ??????????????  ';
    await registerAndLogin(wallet, password);
    await client.request('/api/auth/logout', { method: 'POST', body: {} });
    assert.equal((await client.authenticate(wallet, 'login', password.trim())).status, 401);
    assert.equal((await client.authenticate(wallet, 'login', password)).status, 200);
  });
  it('does not silently truncate a 128-character password', async function () {
    const password = 'qR!7'.repeat(32);
    await registerAndLogin(wallet, password);
    await client.request('/api/auth/logout', { method: 'POST', body: {} });
    assert.equal((await client.authenticate(wallet, 'login', password.slice(0, 127))).status, 401);
  });
  it('rejects registration by a different signing wallet', async function () {
    const challenge = await client.challenge(wallet, 'register');
    const result = await client.request('/api/auth/register', { method: 'POST', body: {
      challengeId: challenge.challengeId, signature: await ethers.Wallet.createRandom().signMessage(challenge.message), password: PASSWORD,
    } });
    assert.equal(result.status, 401);
    assert.ok(!fs.existsSync(filename));
  });
  it('rejects duplicate registration without replacing the stored password', async function () {
    assert.equal((await client.authenticate(wallet, 'register', PASSWORD)).status, 201);
    assert.equal((await client.authenticate(wallet, 'register', 'A different long password')).status, 409);
    assert.equal((await client.authenticate(wallet, 'login', PASSWORD)).status, 200);
  });
  it('consumes successful and failed challenges to prevent replay', async function () {
    await client.authenticate(wallet, 'register', PASSWORD);
    for (const password of [PASSWORD, 'incorrect password']) {
      const challenge = await client.challenge(wallet, 'login');
      const body = { challengeId: challenge.challengeId, signature: await wallet.signMessage(challenge.message), password };
      assert.equal((await client.request('/api/auth/login', { method: 'POST', body })).status, password === PASSWORD ? 200 : 401);
      assert.equal((await client.request('/api/auth/login', { method: 'POST', body })).status, 401);
    }
  });
  it('rejects challenges from another browser context or another purpose', async function () {
    const challenge = await client.challenge(wallet, 'register');
    const body = { challengeId: challenge.challengeId, signature: await wallet.signMessage(challenge.message), password: PASSWORD };
    const attacker = await new Client().ready();
    assert.equal((await attacker.request('/api/auth/register', { method: 'POST', body })).status, 401);
    assert.equal((await client.request('/api/auth/login', { method: 'POST', body })).status, 401);
    assert.equal((await client.request('/api/auth/register', { method: 'POST', body })).status, 201);
  });
  it('rejects expired wallet challenges', async function () {
    const challenge = await client.challenge(wallet, 'register');
    clock += 5 * 60_000 + 1;
    const result = await client.request('/api/auth/register', { method: 'POST', body: {
      challengeId: challenge.challengeId, signature: await wallet.signMessage(challenge.message), password: PASSWORD,
    } });
    assert.equal(result.status, 401);
  });
  it('rejects missing or invalid CSRF tokens and foreign request origins', async function () {
    for (const headers of [{ 'X-CSRF-Token': '' }, { 'X-CSRF-Token': 'wrong' }, { Origin: 'https://evil.example' }, { Origin: '' }, { 'Sec-Fetch-Site': 'cross-site' }]) {
      assert.equal((await client.request('/api/auth/logout', { method: 'POST', body: {}, headers })).status, 403);
    }
  });
  it('sets HttpOnly SameSite cookies and revokes sessions on logout', async function () {
    await client.authenticate(wallet, 'register', PASSWORD);
    const result = await client.authenticate(wallet, 'login', PASSWORD);
    const cookies = result.headers.get('set-cookie');
    assert.match(cookies, /HttpOnly/i);
    assert.match(cookies, /SameSite=Strict/i);
    const stolen = new Client();
    stolen.cookies = new Map(client.cookies);
    assert.equal((await client.request('/api/auth/logout', { method: 'POST', body: {} })).status, 200);
    assert.equal((await stolen.request('/api/auth/history')).status, 401);
  });
  it('invalidates outstanding browser challenges when logging out', async function () {
    await registerAndLogin();
    const challenge = await client.challenge(wallet, 'login');
    const signature = await wallet.signMessage(challenge.message);
    await client.request('/api/auth/logout', { method: 'POST', body: {} });
    await client.ready();
    assert.equal((await client.request('/api/auth/login', { method: 'POST', body: { challengeId: challenge.challengeId, signature, password: PASSWORD } })).status, 401);
  });
  it('rotates the session on login and invalidates the previous token', async function () {
    await registerAndLogin();
    const old = new Client();
    old.cookies = new Map(client.cookies);
    const oldCookie = client.cookies.get('blockauth-session');
    assert.equal((await client.authenticate(wallet, 'login', PASSWORD)).status, 200);
    assert.notEqual(client.cookies.get('blockauth-session'), oldCookie);
    assert.equal((await old.request('/api/auth/session')).status, 401);
  });
  it('enforces idle and absolute session expiry', async function () {
    await registerAndLogin();
    clock += 15 * 60_000 + 1;
    assert.equal((await client.request('/api/auth/session')).status, 401);
    await client.ready();
    assert.equal((await client.authenticate(wallet, 'login', PASSWORD)).status, 200);
    // Poll within the idle timeout, without extending the absolute lifetime.
    for (let i = 0; i < 48; i++) {
      clock += 10 * 60_000;
      const response = await client.request('/api/auth/session');
      assert.equal(response.status, i === 47 ? 401 : 200);
    }
  });
  it('limits repeated verified authentication attempts for the same account', async function () {
    for (let i = 0; i < accountLimit; i++) assert.equal((await client.authenticate(wallet, 'login', PASSWORD)).status, 401);
    const result = await client.authenticate(wallet, 'login', PASSWORD);
    assert.equal(result.status, 429);
    assert.equal(result.headers.get('retry-after'), '900');
  });
  it('does not let unsigned challenge requests lock out an account', async function () {
    for (let i = 0; i < accountLimit + 1; i++) await client.challenge(wallet, 'login');
    assert.equal((await client.authenticate(wallet, 'register', PASSWORD)).status, 201);
  });
  it('limits requests per IP and releases the limit after its window', async function () {
    await stop();
    await start({ ipLimit: 2 });
    client = await new Client().ready();
    assert.equal((await client.request('/api/auth/session')).status, 401);
    assert.equal((await client.request('/api/auth/session')).status, 429);
    clock += 15 * 60_000 + 1;
    assert.equal((await client.request('/api/auth/session')).status, 401);
  });
  it('isolates login history by the server-authenticated wallet', async function () {
    await registerAndLogin();
    const other = ethers.Wallet.createRandom();
    const otherClient = await new Client().ready();
    await registerAndLogin(other, PASSWORD, otherClient);
    await otherClient.authenticate(other, 'login', 'incorrect password');
    assert.equal((await client.request('/api/auth/history')).data.events.length, 1);
    assert.equal((await otherClient.request('/api/auth/history')).data.events.length, 2);
  });
  it('retains credential verifiers but invalidates sessions on restart', async function () {
    await registerAndLogin();
    await stop();
    await start();
    assert.equal((await client.request('/api/auth/session')).status, 401);
    await client.ready();
    assert.equal((await client.authenticate(wallet, 'login', PASSWORD)).status, 200);
  });
  it('fails closed if production is configured with an HTTP origin', async function () {
    await assert.rejects(createApp({ origin: ORIGIN, storeFile: filename, secureCookies: true }), /HTTPS/);
  });
  it('refuses credential requests over HTTP when secure mode is enabled', async function () {
    await stop();
    await start({ origin: 'https://example.test', secureCookies: true });
    const response = await client.request('/api/auth/csrf');
    assert.equal(response.status, 426);
    assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000');
  });
  it('binds wallet signatures to the originating application even with multiple allowed origins', async function () {
    await stop();
    await start({ origin: ORIGIN + ',http://localhost:3000' });
    client = await new Client().ready();
    const challenge = await client.challenge(wallet, 'register');
    const body = { challengeId: challenge.challengeId, signature: await wallet.signMessage(challenge.message), password: PASSWORD };
    assert.equal((await client.request('/api/auth/register', { method: 'POST', body, headers: { Origin: 'http://localhost:3000' } })).status, 401);
    assert.equal((await client.request('/api/auth/register', { method: 'POST', body })).status, 201);
  });
  it('rejects non-JSON, oversized requests and never returns internal errors', async function () {
    assert.equal((await client.request('/api/auth/logout', { method: 'POST', body: {}, headers: { 'Content-Type': 'text/plain' } })).status, 415);
    assert.equal((await client.request('/api/auth/login', { method: 'POST', body: { password: 'x'.repeat(9000) } })).status, 413);
    const response = await client.request('/api/not-found');
    assert.equal(response.status, 404);
    assert.ok(!JSON.stringify(response.data).includes('stack'));
  });
});
