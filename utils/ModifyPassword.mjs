import { analyzePassword } from './analyzePassword.js';

export function modifyPassword(password) {
  const leetspeakMap = {
    'a': '@', 'e': '3', 'i': '1', 'o': '0', 's': '$', 't': '7',
    'b': '8', 'g': '9', 'l': '1', 'z': '2'
  };

  const delimiters = ['_', '-', '.', '@', '#', '!', '$'];

  const applyModifications = (pwd) => {
    let modified = pwd.replace(/[aeiostbglz]/gi, char => {
      const lowercaseChar = char.toLowerCase();
      return leetspeakMap[lowercaseChar] || char;
    });

    modified = modified.split("").map(char =>
      Math.random() > 0.5 ? char.toUpperCase() : char
    ).join("");

    modified = modified.split("").map((char, index) => {
      if (index % 3 === 0 && Math.random() > 0.5) {
        return `${char}${delimiters[Math.floor(Math.random() * delimiters.length)]}`;
      }
      return char;
    }).join("");

    if (delimiters.includes(modified.slice(-1))) {
      modified = modified.slice(0, -1);
    }

    return modified;
  };

  const originalScore = analyzePassword(password).score;
  let modifiedPassword;
  let attempts = 0;

  do {
    modifiedPassword = applyModifications(password);
    const newScore = analyzePassword(modifiedPassword).score;
    attempts++;
    if (newScore > originalScore || attempts > 10) break;
  } while (true);

  return modifiedPassword;
}
