import { useEffect, useState } from 'react';

export function useWallet() {
  const [account, setAccount] = useState('');

  useEffect(() => {
    const wallet = window.ethereum;
    if (!wallet) return;
    const accountsChanged = (accounts) => setAccount(accounts[0] || '');
    const reset = () => setAccount('');
    wallet.on('accountsChanged', accountsChanged);
    wallet.on('chainChanged', reset);
    wallet.on('disconnect', reset);
    return () => {
      wallet.removeListener('accountsChanged', accountsChanged);
      wallet.removeListener('chainChanged', reset);
      wallet.removeListener('disconnect', reset);
    };
  }, []);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error('Please install MetaMask.');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0] || '');
    } catch (error) {
      alert(error.code === 4001 ? 'Wallet connection was rejected.' : error.message);
    }
  };

  return { account, connectWallet };
}
