import React, { useState } from 'react';
import { modifyPassword } from '../utils/ModifyPassword.mjs';
import PasswordAnalysis from '../components/PasswordAnalysis.jsx';

const Register = () => {
  const [password, setPassword] = useState('');
  const [modified, setModified] = useState('');
  const [copied, setCopied] = useState(false);

  const handlePasswordChange = (e) => {
    const original = e.target.value;
    setPassword(original);
    setModified(modifyPassword(original));
    setCopied(false); // Reset copied state when typing again
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(modified);
    setCopied(true);
  };

  return (
    <div>
      <h2>Register</h2>
      
      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={handlePasswordChange}
      />
      
      {modified && (
        <div>
          <h4>Suggested Password:</h4>
          <p>{modified}</p>
          <button onClick={handleCopy}>Copy to Clipboard</button>
          {copied && <span style={{ marginLeft: '10px', color: 'green' }}>Copied!</span>}
        </div>
      )}

      <PasswordAnalysis password={password} />
    </div>
  );
};

export default Register;
