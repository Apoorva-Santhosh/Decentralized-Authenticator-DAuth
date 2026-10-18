// Password authentication uses this API; credentials never enter blockchain calls.
import { ethers } from 'ethers';
import { passwordError } from './passwordPolicy.js';

export async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', ...options });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error || 'The authentication server is unavailable.');
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function post(path, body = {}) {
  const { csrfToken } = await api('/api/auth/csrf');
  return api(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
    body: JSON.stringify(body),
  });
}

export async function authenticate(purpose, account, password) {
  const error = passwordError(password, purpose === 'register');
  if (error) throw new Error(error);
  if (!window.ethereum || !account) throw new Error('Please connect your wallet first.');
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const signer = provider.getSigner(account);
  const accounts = await provider.listAccounts();
  if (accounts[0]?.toLowerCase() !== account.toLowerCase()) throw new Error('Your wallet account changed. Please try again.');
  const { challengeId, message } = await post('/api/auth/challenge', { address: account, purpose });
  const signature = await signer.signMessage(message);
  const result = await post(`/api/auth/${purpose}`, { challengeId, signature, password });
  const currentAccounts = await window.ethereum.request({ method: 'eth_accounts' });
  if (currentAccounts[0]?.toLowerCase() !== account.toLowerCase()) {
    if (purpose === 'login') await post('/api/auth/logout');
    throw new Error('Your wallet account changed. Please try again.');
  }
  return result;
}
