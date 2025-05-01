import React, { useState } from 'react';
import '../pages/Login.css';
import backgroundImage from '../assets/background.jpg';
import { hashPassword } from '../utils/hashUtils.js';
import { ethers } from 'ethers';
import AuthManagerABI from '../artifacts/contracts/AuthManager.sol/AuthManager.json';

const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

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
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask.');
        return;
      }
  
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AuthManagerABI.abi, signer);
      console.log("Password during login:", password);

      const hashed = hashPassword(password);
      console.log("Hashed password during login:", hashed); // Debugging line
  
      const success = await contract.login(hashed);
      if (success) {
        alert('Login successful!');
      } else {
        alert('Login failed: Incorrect password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login.');
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
