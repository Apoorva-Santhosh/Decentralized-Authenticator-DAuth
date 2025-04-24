import React, { useState } from 'react';
import { modifyPassword } from '../utils/ModifyPassword.mjs';
import PasswordAnalysis from '../components/PasswordAnalysis';

const Register = () => {
  const [password, setPassword] = useState('');
  const [modified, setModified] = useState('');

  const handlePasswordChange = (e) => {
    const original = e.target.value;
    setPassword(original);
    setModified(modifyPassword(original));
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
      <PasswordAnalysis password={password} />
      {modified && (
        <div>
          <h4>Suggested Password:</h4>
          <p>{modified}</p>
        </div>
      )}
    </div>
  );
};

export default Register;