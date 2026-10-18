import React, { useState, useEffect, useRef } from 'react';
import './Register.css';
import { modifyPassword } from '../utils/ModifyPassword.mjs';
import { authenticate } from '../utils/authApi.js';
import { passwordError } from '../utils/passwordPolicy.js';
import { useAuth } from '../components/AuthContext.jsx';
import { analyzePassword } from '../utils/analyzePassword.js';
import { getAuthContract } from '../utils/wallet.js';
import { useWallet } from '../utils/useWallet.js';

const Register = () => {
  const [password, setPassword] = useState('');
  const [modifiedPassword, setModifiedPassword] = useState('');
  const [analysisOriginal, setAnalysisOriginal] = useState(null);
  const [analysisModified, setAnalysisModified] = useState(null);
  const [copied, setCopied] = useState(false);
  const { account, connectWallet } = useWallet();
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const copyTimer = useRef();
  const passwordVersion = useRef(0);
  const [registeredAccount, setRegisteredAccount] = useState('');
  const { session } = useAuth();

  useEffect(() => {
    setAnalysisOriginal(null);
    setModifiedPassword('');
    setAnalysisModified(null);
    setCopied(false);
    clearTimeout(copyTimer.current);
    // Avoid running dictionary searches and suggestion generation on every keystroke.
    const timer = setTimeout(() => {
      if (passwordError(password)) return;
      setAnalysisOriginal(analyzePassword(password));
      const modified = modifyPassword(password);
      setModifiedPassword(modified);
      setAnalysisModified(modified ? analyzePassword(modified) : null);
    }, 300);
    return () => clearTimeout(timer);
  }, [password]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const handleCopy = async () => {
    const version = passwordVersion.current;
    try {
      await navigator.clipboard.writeText(modifiedPassword);
      if (version !== passwordVersion.current) return;
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('Could not copy the password. Please copy it manually.');
    }
  };

  const handleRegister = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    try {
      if (!account) throw new Error('Please connect your wallet first.');
      await authenticate('register', account, password);
      setRegisteredAccount(account.toLowerCase());
      setPassword('');
      alert('Account registered. You can now log in with your password and wallet.');
    } catch (error) {
      alert(error.code === 4001 || error.code === 'ACTION_REJECTED'
        ? 'Wallet signature was rejected by the user.'
        : 'An error occurred during registration: ' + error.message);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };

  const recordRegistration = async () => {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    try {
      const { contract } = await getAuthContract(true);
      const signerAddress = await contract.signer.getAddress();
      if (signerAddress.toLowerCase() !== account.toLowerCase()) throw new Error('Your wallet account changed.');
      if (await contract.isRegistered(signerAddress)) throw new Error('Wallet registration is already recorded.');
      // The contract receives no password, password hash, or session credential.
      await (await contract.register()).wait();
      alert('Wallet registration recorded on the blockchain.');
    } catch (error) {
      alert(error.code === 4001 || error.code === 'ACTION_REJECTED' ? 'Transaction rejected.' : error.message);
    } finally {
      submitting.current = false;
      setPending(false);
    }
  };

  const renderAnalysis = (title, analysis) => (
    <div style={{ marginTop: '20px' }}>
      <h3>{title}</h3>
      <p><strong>Strength:</strong> {analysis.feedback}</p>
      <p><strong>Closest Weak Password:</strong> {analysis.closestWeak}</p>
      <p><strong>Levenshtein Distance:</strong> {analysis.levenshteinDistance}</p>
      <p><strong>Warning:</strong> {analysis.warning || "None"}</p>
      <p><strong>Guess Times:</strong></p>
        <p>100 / hour: {analysis.guessTimes.online_throttling_100_per_hour}</p>
        <p>10 / second: {analysis.guessTimes.online_no_throttling_10_per_second}</p>
        <p>10k / second: {analysis.guessTimes.offline_slow_hashing_1e4_per_second}</p>
        <p>10B / second: {analysis.guessTimes.offline_fast_hashing_1e10_per_second}</p>
    </div>
  );

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Register</h2>

        <div className="input-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => { passwordVersion.current++; setPassword(e.target.value); }}
            disabled={pending}
            style={{ padding: '8px', width: '300px' }}
          />
          {!account ? (
            <button className="connect-btn" onClick={connectWallet} disabled={pending}>Connect Wallet</button>
          ) : (
            <p style={{ fontWeight: 'bold' }}>Connected: {account}</p>
          )}
        </div>

        <p>Use 15 to 128 characters. Spaces and Unicode are welcome.</p>
        {password && passwordError(password, true) && <p role="status">{passwordError(password, true)}</p>}

        {/* Original password analysis */}
        {analysisOriginal && renderAnalysis("Original Password Analysis", analysisOriginal)}

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

            {analysisModified && renderAnalysis("Modified Password Analysis", analysisModified)}
          </div>
        )}

        <button onClick={handleRegister} disabled={pending} style={{ marginTop: '30px', padding: '10px 20px' }}>
          {pending ? 'Please wait...' : 'Register'}
        </button>
      </div>
    </div>
  );
};

export default Register;
