import React, { useState, useEffect } from 'react';
import './Register.css';
import { modifyPassword } from '../utils/ModifyPassword.mjs';
import { hashPassword } from '../utils/hashUtils.js'; // Import the hashing function
import zxcvbn from 'zxcvbn';
import levenshtein from 'fast-levenshtein';
import weakPasswords from '../weak_passwords.json';

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

const Register = () => {
  const [password, setPassword] = useState('');
  const [modifiedPassword, setModifiedPassword] = useState('');
  const [analysisOriginal, setAnalysisOriginal] = useState(null);
  const [analysisModified, setAnalysisModified] = useState(null);
  const [copied, setCopied] = useState(false);
  const [hashedPassword, setHashedPassword] = useState(''); // Hash after clicking Register

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

  const handleCopy = () => {
    navigator.clipboard.writeText(modifiedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleRegister = () => {
    const finalPassword = modifiedPassword || password;
    const hashed = hashPassword(finalPassword);
    setHashedPassword(hashed);

    
    console.log('Password ready to send:', hashed);
    alert('Password hashed and ready! (Check console)');
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <h2>Register</h2>

        <input
          type="password"
          placeholder="Enter Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '8px', width: '300px' }}
        />

        {analysisOriginal && (
          <div style={{ marginTop: '20px' }}>
            <h3>Original Password Analysis</h3>
            <p><strong>Strength:</strong> {analysisOriginal.feedback}</p>
            <p><strong>Estimated Crack Time:</strong> {analysisOriginal.crackTime}</p>
            <p><strong>Closest Weak Password:</strong> {analysisOriginal.closestWeak}</p>
            <p><strong>Levenshtein Distance:</strong> {analysisOriginal.levenshteinDistance}</p>
          </div>
        )}

        {modifiedPassword && (
          <div style={{ marginTop: '30px' }}>
            <h3>Suggested Modified Password</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <p style={{ fontWeight: 'bold', fontSize: '18px', wordBreak: 'break-word' }}>{modifiedPassword}</p>
              <button onClick={handleCopy} style={{ padding: '5px 10px' }}>
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

        {/* Register Button */}
        <button 
          onClick={handleRegister} 
          style={{ marginTop: '30px', padding: '10px 20px' }}
        >
          Register
        </button>

        {/* Show hashed password only after clicking Register */}
        {hashedPassword && (
          <div style={{ marginTop: '30px', wordBreak: 'break-word' }}>
            <h3>Hashed Password (Ready for Smart Contract)</h3>
            <p>{hashedPassword}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Register;
