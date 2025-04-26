import React, { useState } from 'react';
import zxcvbn from 'zxcvbn';
import levenshtein from 'fast-levenshtein';
import weakPasswords from '../weak_passwords.json';  // Make sure you have a file with weak passwords

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

  // Return the analysis result, ensuring that entropy is safe to use
  return {
    score: result.score,
    feedback: scoreText[result.score],
    crackTime: result.crack_times_display.offline_slow_hashing_1e4_per_second,
    entropy: result.entropy ? result.entropy.toFixed(2) : 'N/A', // Check if entropy exists
    closestWeak: closestMatch,
    levenshteinDistance: minDistance
  };
};

const PasswordAnalysis = () => {
  const [password, setPassword] = useState('');
  const [analysis, setAnalysis] = useState(null);

  const handleAnalyze = () => {
    setAnalysis(analyzePassword(password));
  };

  return (
    <div>
      <h3>Analyze Password</h3>
      <input
        type="password"
        placeholder="Enter password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleAnalyze}>Analyze</button>

      {analysis && (
        <div>
          <p><strong>Strength:</strong> {analysis.feedback}</p>
          <p><strong>Entropy:</strong> {analysis.entropy}</p>
          <p><strong>Estimated Crack Time:</strong> {analysis.crackTime}</p>
          <p><strong>Closest Weak Password:</strong> {analysis.closestWeak}</p>
          <p><strong>Levenshtein Distance:</strong> {analysis.levenshteinDistance}</p>
        </div>
      )}
    </div>
  );
};

export default PasswordAnalysis;
