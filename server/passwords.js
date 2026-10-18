import argon2 from 'argon2';
import { readFileSync } from 'node:fs';
import { passwordError } from '../utils/passwordPolicy.js';

// OWASP's Argon2id minimum: 19 MiB, two iterations, one lane.
export const HASH_OPTIONS = Object.freeze({
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
  hashLength: 32,
});
const blockedPasswords = new Set(JSON.parse(readFileSync(new URL('../weak_passwords.json', import.meta.url), 'utf8')).map((value) => value.toLowerCase()));

export function registrationError(password) {
  return passwordError(password, true) || (blockedPasswords.has(password.trim().toLowerCase()) ? 'Choose a password outside the common-password list.' : '');
}

export const hashPassword = (password) => argon2.hash(password, HASH_OPTIONS);
export const verifyPassword = (hash, password) => argon2.verify(hash, password);
