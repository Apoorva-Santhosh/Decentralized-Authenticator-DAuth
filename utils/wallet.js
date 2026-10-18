import { ethers } from 'ethers';
import { passwordError } from './passwordPolicy.js';
import AuthManagerABI from '../artifacts/contracts/AuthManager.sol/AuthManager.json';

// This is the local network configured in hardhat.config.cjs.
export const CHAIN_ID = 31337;
export const CONTRACT_ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export async function getAuthContract(writable = false) {
  if (!window.ethereum) throw new Error('Please install MetaMask.');
  const provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
  const network = await provider.getNetwork();
  if (network.chainId !== CHAIN_ID) {
    throw new Error(`Please select the local Hardhat network (chain ID ${CHAIN_ID}) in MetaMask.`);
  }
  if (await provider.getCode(CONTRACT_ADDRESS) === '0x') {
    throw new Error('AuthManager is not deployed at the configured address on this network.');
  }
  const connection = writable
    ? provider.getSigner(await provider.getSigner().getAddress())
    : provider;
  return { provider, contract: new ethers.Contract(CONTRACT_ADDRESS, AuthManagerABI.abi, connection) };
}

export function validatePassword(password) {
  const error = passwordError(password);
  if (error) throw new Error(error);
}
