import zxcvbn from 'zxcvbn';
import levenshtein from 'fast-levenshtein';
import weakPasswords from '../weak_passwords.json';

export const analyzePassword = (password) => {
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
