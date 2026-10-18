import React, { useRef, useState } from 'react';
import '../pages/Login.css';
import backgroundImage from '../assets/background.jpg';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.jsx';
import { useWallet } from '../utils/useWallet.js';

const Login = () => {
  const [password, setPassword] = useState('');
  const { account, connectWallet } = useWallet();
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    try {
      if (!account) throw new Error('Please connect your wallet first.');
      await login(account, password);
      setPassword('');
      navigate('/ledger');
    } catch (error) {
      alert(error.code === 4001 || error.code === 'ACTION_REJECTED'
        ? 'Wallet signature was rejected by the user.'
        : 'An error occurred during login: ' + error.message);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };

  return (
    <div className="login-container" style={{ backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="login-box">
        <h2>Login</h2>
        {!account && <button onClick={connectWallet} disabled={pending}>Connect Wallet</button>}
        {account && <p>Connected: {account}</p>}
        <form onSubmit={handleSubmit}>
          <input type="text" name="username" autoComplete="username" value={account} readOnly aria-label="Wallet address" />
          <input type="password" autoComplete="current-password" placeholder="Enter Password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={pending} required />
          <button type="submit" disabled={pending}>{pending ? 'Logging in...' : 'Login'}</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
