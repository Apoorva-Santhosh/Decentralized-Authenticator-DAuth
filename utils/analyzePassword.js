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
    warning: result.feedback.warning,
    suggestions: result.feedback.suggestions,
    guessTimes: result.crack_times_display,
    closestWeak: closestMatch,
    levenshteinDistance: minDistance
  };
};
