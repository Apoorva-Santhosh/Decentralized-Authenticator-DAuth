export function modifyPassword(password) {
    let modified = password.split('').map((char, i) => (i % 2 === 0 ? char.toUpperCase() : char)).join('');
    modified += Math.random().toString(36).substring(2, 4);
    return modified;
  }