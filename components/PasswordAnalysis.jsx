import React, { useState, useEffect } from 'react';
import { analyzePassword } from '../utils/analyzePassword';

const PasswordAnalysis = ({ password, modifiedPassword }) => {
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (modifiedPassword) {
      setAnalysis(analyzePassword(modifiedPassword));
    } else if (password) {
      setAnalysis(analyzePassword(password));
    }
  }, [password, modifiedPassword]);

  return (
    <div>
      <h3>Password Analysis</h3>
      {analysis && (
        <div>
          <p><strong>Strength:</strong> {analysis.feedback}</p>
          <p><strong>Estimated Crack Time:</strong> {analysis.crackTime}</p>
          <p><strong>Closest Weak Password:</strong> {analysis.closestWeak}</p>
          <p><strong>Levenshtein Distance:</strong> {analysis.levenshteinDistance}</p>
        </div>
      )}
    </div>
  );
};

export default PasswordAnalysis;
