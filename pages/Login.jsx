import React, { useState } from 'react';
import '../pages/Login.css';
import backgroundImage from '../assets/background.jpg';
import { hashPassword } from '../utils/hashUtils.js';
import { ethers } from 'ethers';
import AuthManagerABI from '../artifacts/contracts/AuthManager.sol/AuthManager.json';

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const Login = () => {
  const [password, setPassword] = useState('');
  const [account, setAccount] = useState('');

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Please install MetaMask.");
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    setAccount(accounts[0]);
  };

  
  const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("Login button clicked");

  try {
    if (!window.ethereum) {
      alert('Please install MetaMask.');
      return;
    }

    if (!account) {
      alert('Please connect your wallet first.');
      return;
    }

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const signerAddress = await signer.getAddress();

    const contract = new ethers.Contract(CONTRACT_ADDRESS, AuthManagerABI.abi, signer);

    const finalPassword = password.trim();
    const hashed = hashPassword(finalPassword);
    console.log("Hashed password during login:", hashed);

    const tx = await contract.login(hashed);
    console.log("Login transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Login receipt:", receipt);

    // Extract and interpret event
    const loginEvent = receipt.events.find((e) => e.event === "LoginAttempt");

    if (!loginEvent) {
      alert("Login failed: No event emitted.");
      return;
    }

    const success = loginEvent.args.success;
    console.log("Login success:", success);

    if (success) {
      alert('Login successful!');
    } else {
      alert('Login failed: Incorrect password.');
    }
  } catch (error) {
    console.error('Login error:', error);
    if (error.code === 4001) {
      alert('Transaction was rejected by the user.');
    } else {
      alert('An error occurred during login: ' + error.message);
    }
  }
};


  return (
    <div
      className="login-container"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="login-box">
        <h2>Login</h2>
        {!account && <button onClick={connectWallet}>Connect Wallet</button>}
        {account && <p>Connected: {account}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
