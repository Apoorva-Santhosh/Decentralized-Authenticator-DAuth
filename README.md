# Blockchain Authentication and Password Analysis

This project retains password registration/login, browser-side password analysis,
and stronger suggestions. Login requires both the password and a one-time wallet
signature. Password verification and sessions are handled by the Express server.
The Solidity contract is a public wallet registry; it never accepts a password or
password hash.

## Local use

Install dependencies with `npm install`. Run `npm start` for the authentication
API on localhost:3000 and `npm run dev` in a second terminal for the frontend on
localhost:5173. Open http://localhost:5173. Vite proxies `/api` to the local server.
Contract compilation runs before the frontend build and development server.

Use `npm test` for the regression suite and `npm run build` to build the frontend.
The blockchain registration button is a separate optional action requiring the
revised AuthManager contract on the configured local network. Password login does
not require a running blockchain node or a deployed contract.

## Authentication behavior

- Connect a wallet, enter a password, and sign the registration challenge.
- Register passwords of 15 to 128 Unicode characters. Spaces are significant;
  passwords are never silently trimmed, normalized, or truncated. The local
  common-password dictionary is checked on the server.
- The browser retains the strength meter, weak-password similarity check, and
  suggested alternatives. Suggestions use secure random bytes and must improve
  the estimated score. They are never applied without the user's choice.
- The server stores an Argon2id verifier with a unique salt, 19 MiB memory,
  two iterations, one lane, and a 32-byte hash. It never logs passwords or hashes.
- Login requires the correct password and an unexpired, single-use wallet proof
  bound to the browser context, request purpose, and application origin.
- The server creates an opaque session cookie with HttpOnly and SameSite=Strict.
  Secure cookies and HTTPS enforcement are enabled in production mode.
- Login rotates the current browser's session. Logout invalidates it server-side.
  Sessions expire after 15 minutes idle or 8 hours total.
- Login history is protected by the server and scoped to the session's wallet.
  Public wallet registration events are shown separately.

## OWASP guidance applied

The implementation follows the linked guidance for password hashing, input
handling, throttling, generic login failures, CSRF protection, and cookie/session
handling. This is scoped engineering guidance, not an OWASP certification or a
claim that every recommendation has been implemented.

- [Password Storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

## Private data and current limits

The local single-process server persists password verifiers and the latest 100
login results per account in `.auth-data/users.json`, outside the static frontend.
The directory is ignored by Git and Docker and denied by the Vite file server.
Keep its filesystem permissions private. Do not run multiple server processes
against this file: shared durable database/state management is not implemented.
Sessions, CSRF contexts, challenge replay protection, and throttle counters live
in memory and reset when the server restarts. A restart invalidates sessions.

The dictionary is a limited local common-password list, not a comprehensive
breached-password service. Password recovery/change, smart-contract-wallet
signature validation, and a full independent security review remain future work.
Wallet proofs currently support externally owned Ethereum accounts (EOAs).

`APP_ORIGIN` can restrict the accepted application origin. Local defaults allow
localhost:5173 and localhost:3000. Production mode requires an explicit HTTPS
origin and refuses credential requests received over HTTP; proxy/TLS hosting
configuration is intentionally outside this change.

Old on-chain password records cannot be erased or safely migrated into the new
scheme. Use the revised registry and register credentials anew. Previously public
hashes remain public. The old `register(bytes32)` and `login(bytes32)` functions
are removed from the new contract.
