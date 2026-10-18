import zxcvbn from 'zxcvbn';
import { ethers } from 'ethers';
import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from './passwordPolicy.js';

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%_-';
function randomIndex(length) {
  const limit = 2 ** 32 - (2 ** 32 % length);
  let value;
  do {
    const bytes = ethers.utils.randomBytes(4);
    value = new DataView(bytes.buffer, bytes.byteOffset, 4).getUint32(0);
  } while (value >= limit);
  return value % length;
}

export function modifyPassword(password) {
  if (!password.trim() || Array.from(password).length > MAX_PASSWORD_LENGTH) return '';
  const originalScore = zxcvbn(password).score;
  if (originalScore === 4) return '';
  const leetspeak = { a: '@', e: '3', i: '1', o: '0', s: '$', t: '7', b: '8', g: '9', l: '1', z: '2' };
  for (let attempt = 0; attempt < 11; attempt++) {
    const transformed = password.replace(/[aeiostbglz]/gi, (char) => leetspeak[char.toLowerCase()]);
    const suffix = Array.from({ length: 16 }, () => characters[randomIndex(characters.length)]).join('');
    const candidate = `${transformed}-${suffix}`;
    const length = Array.from(candidate).length;
    if (length >= MIN_PASSWORD_LENGTH && length <= MAX_PASSWORD_LENGTH && zxcvbn(candidate).score > originalScore) return candidate;
  }
  return '';
}
