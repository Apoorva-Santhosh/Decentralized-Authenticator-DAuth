export function modifyPassword(password) {
  let modified = password;

  // Leetspeak mapping for characters
  const leetspeakMap = {
    'a': '@', 'e': '3', 'i': '1', 'o': '0', 's': '$', 't': '7', 
    'b': '8', 'g': '9', 'l': '1', 'z': '2'
  };

  // Step 1: Convert characters to leetspeak (case insensitive)
  modified = modified.replace(/[aeiostbglz]/gi, char => {
    const lowercaseChar = char.toLowerCase();
    return leetspeakMap[lowercaseChar] || char;
  });

  // Step 2: Random capitalization (50% chance)
  modified = modified.split("").map(char => {
    return Math.random() > 0.5 ? char.toUpperCase() : char;
  }).join("");

  // Step 3: Insert random delimiters every 3rd character
  const delimiters = ['_', '-', '.', '@', '#', '!', '$'];
  modified = modified.split("").map((char, index) => {
    if (index % 3 === 0 && Math.random() > 0.5) {
      return `${char}${delimiters[Math.floor(Math.random() * delimiters.length)]}`;
    }
    return char;
  }).join("");

  // Step 4: Remove extra trailing delimiter
  if (modified.endsWith('_') || modified.endsWith('-') || modified.endsWith('.') || modified.endsWith('@') || modified.endsWith('#') || modified.endsWith('!') || modified.endsWith('$')) {
    modified = modified.slice(0, -1);
  }

  return modified;
}
