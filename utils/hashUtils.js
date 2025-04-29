import crypto from 'crypto';

export const hashPassword = (password) => {
  return '0x' + crypto.createHash('sha256').update(password).digest('hex');
};
