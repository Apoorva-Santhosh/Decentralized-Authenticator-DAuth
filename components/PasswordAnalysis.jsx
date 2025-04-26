import React, { useState, useEffect } from 'react';
import zxcvbn from 'zxcvbn';
import levenshtein from 'fast-levenshtein';
import weakPasswords from '../weak_passwords.json';

const analyzePassword = (password) => {
  const result = zxcvbn(password);
  const scoreText = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];

  let closestMatch = '';
  let minDistance = Infinity;

  // Find the closest match to a weak password using Levenshtein distance
  for (const weakPass of weakPasswords) {
    const dist = levenshtein.get(password, weakPass);
    if (dist < minDistance) {
      minDistance = dist;
      closestMatch = weakPass;
    }
  }

  // Return the analysis result (without entropy)
  return {
    score: result.score,
    feedback: scoreText[result.score],
    crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second,
    closestWeak: closestMatch,
    levenshteinDistance: minDistance
  };
};

const PasswordAnalysis = ({ password, modifiedPassword }) => {
  const [analysis, setAnalysis] = useState(null);

  // Analyze the entered password
  useEffect(() => {
    if (password) {
      setAnalysis(analyzePassword(password));  // Analyze original password
    }
  }, [password]);

  // Analyze the modified password
  useEffect(() => {
    if (modifiedPassword) {
      setAnalysis(analyzePassword(modifiedPassword));  // Analyze modified password
    }
  }, [modifiedPassword]);

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
