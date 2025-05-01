import React, { useState, useEffect } from 'react';
import './Register.css';
import { modifyPassword } from '../utils/ModifyPassword.mjs';
import { hashPassword } from '../utils/hashUtils.js';
import zxcvbn from 'zxcvbn';
import levenshtein from 'fast-levenshtein';
import weakPasswords from '../weak_passwords.json';
import { ethers } from 'ethers';
import AuthManagerABI from '../artifacts/contracts/AuthManager.sol/AuthManager.json';

const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

const Register = () => {
  const [password, setPassword] = useState('');
  const [modifiedPassword, setModifiedPassword] = useState('');
  const [analysisOriginal, setAnalysisOriginal] = useState(null);
  const [analysisModified, setAnalysisModified] = useState(null);
  const [copied, setCopied] = useState(false);
  const [account, setAccount] = useState('');
  const [hashedPassword, setHashedPassword] = useState(''); 

  // Analyze passwords
  const analyzePassword = (password) => {
    const result = zxcvbn(password);
    const scoreText = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

    let closestMatch = '';
    let minDistance = Infinity;

    for (const weakPass of weakPasswords) {
      const dist = levenshtein.get(password, weakPass);
      if (dist < minDistance) {
        minDistance = dist;
        closestMatch = weakPass;
      }
    }

    return {
      score: result.score,
      feedback: scoreText[result.score],
      crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second,
      closestWeak: closestMatch,
      levenshteinDistance: minDistance
    };
  };

  useEffect(() => {
    if (password) {
      setAnalysisOriginal(analyzePassword(password));
      const modified = modifyPassword(password);
      setModifiedPassword(modified);
      setAnalysisModified(analyzePassword(modified));
    } else {
      setAnalysisOriginal(null);
      setModifiedPassword('');
      setAnalysisModified(null);
    }
  }, [password]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) return alert("Please install MetaMask.");
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (err) {
      console.error('Wallet connection error:', err);
      alert('Failed to connect wallet.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(modifiedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  
  const handleRegister = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask to register.');
        return;
      }
      console.log("Password during registration:", password);

      const finalPassword = modifiedPassword || password;
      const hashed = hashPassword(finalPassword);
      console.log("Hashed password during registration:", hashed); // Debugging line
      setHashedPassword(hashed);
  
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, AuthManagerABI.abi, signer);
  
      const isRegistered = await contract.isRegistered(account);
      if (isRegistered) {
        alert('User is already registered.');
        return;
      }
  
      const tx = await contract.register(hashed);
      await tx.wait();
      alert('User registered successfully!');
    } catch (error) {
      console.error('Registration failed:', error);
      alert('An error occurred during registration.');
    }
  };
  

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Register</h2>

        {/* Wallet + Password input */}
        <div className="input-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '8px', width: '300px' }}
          />
          {!account ? (
            <button className="connect-btn" onClick={connectWallet}>Connect Wallet</button>
          ) : (
            <p style={{ fontWeight: 'bold' }}>Connected: {account}</p>
          )}
        </div>

        {/* Original password analysis */}
        {analysisOriginal && (
          <div style={{ marginTop: '20px' }}>
            <h3>Original Password Analysis</h3>
            <p><strong>Strength:</strong> {analysisOriginal.feedback}</p>
            <p><strong>Estimated Crack Time:</strong> {analysisOriginal.crackTime}</p>
            <p><strong>Closest Weak Password:</strong> {analysisOriginal.closestWeak}</p>
            <p><strong>Levenshtein Distance:</strong> {analysisOriginal.levenshteinDistance}</p>
          </div>
        )}

        {/* Modified password and its analysis */}
        {modifiedPassword && (
          <div style={{ marginTop: '30px' }}>
            <h3>Suggested Modified Password</h3>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 'bold', fontSize: '18px', wordBreak: 'break-word' }}>
                {modifiedPassword}
              </p>
              <button onClick={handleCopy} style={{ padding: '5px 10px', marginTop: '10px' }}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {analysisModified && (
              <div style={{ marginTop: '15px' }}>
                <h4>Modified Password Analysis</h4>
                <p><strong>Strength:</strong> {analysisModified.feedback}</p>
                <p><strong>Estimated Crack Time:</strong> {analysisModified.crackTime}</p>
                <p><strong>Closest Weak Password:</strong> {analysisModified.closestWeak}</p>
                <p><strong>Levenshtein Distance:</strong> {analysisModified.levenshteinDistance}</p>
              </div>
            )}
          </div>
        )}

        <button onClick={handleRegister} style={{ marginTop: '30px', padding: '10px 20px' }}>
          Register
        </button>
      </div>
    </div>
  );
};

export default Register;
