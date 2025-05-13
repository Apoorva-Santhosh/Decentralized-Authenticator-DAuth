import React, { useState, useEffect } from 'react';
import { analyzePassword } from '../utils/analyzePassword';

const PasswordAnalysis = ({ password, modifiedPassword }) => {
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    const pwdToAnalyze = modifiedPassword || password;
    if (pwdToAnalyze) {
      const result = analyzePassword(pwdToAnalyze);
      setAnalysis(result);
    }
  }, [password, modifiedPassword]);

  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h3>Password Analysis</h3>
      {analysis ? (
        <div>
          <p><strong>Password:</strong> {modifiedPassword || password}</p>
          <p><strong>Strength:</strong> {analysis.scoreLabel} ({analysis.score} / 4)</p>
          <p><strong>Guesses (log10):</strong> {analysis.guessesLog10.toFixed(5)}</p>
          <p><strong>Function Runtime:</strong> {analysis.functionRuntime} ms</p>

          <h4>Crack Time Estimates:</h4>
          <ul>
            <li><strong>100/hour (throttled):</strong> {analysis.allCrackTimes.online_throttling_100_per_hour}</li>
            <li><strong>10/sec (online):</strong> {analysis.allCrackTimes.online_no_throttling_10_per_second}</li>
            <li><strong>10k/sec (offline, slow hash):</strong> {analysis.allCrackTimes.offline_slow_hashing_1e4_per_second}</li>
            <li><strong>10B/sec (offline, fast hash):</strong> {analysis.allCrackTimes.offline_fast_hashing_1e10_per_second}</li>
          </ul>

          <p><strong>Warning:</strong> {analysis.warning}</p>

          {analysis.suggestions.length > 0 && (
            <>
              <p><strong>Suggestions:</strong></p>
              <ul>
                {analysis.suggestions.map((suggestion, i) => (
                  <li key={i}>- {suggestion}</li>
                ))}
              </ul>
            </>
          )}

          <p><strong>Closest Weak Password:</strong> {analysis.closestWeak}</p>
          <p><strong>Levenshtein Distance:</strong> {analysis.levenshteinDistance}</p>
        </div>
      ) : (
        <p>No password analyzed yet.</p>
      )}
    </div>
  );
};

export default PasswordAnalysis;