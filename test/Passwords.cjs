const assert = require('node:assert/strict');
const zxcvbn = require('zxcvbn');

describe('Password suggestions', function () {
  let modifyPassword;
  before(async function () {
    ({ modifyPassword } = await import('../utils/ModifyPassword.mjs'));
  });
  it('does not suggest passwords for empty, whitespace-only, or oversized input', function () {
    for (const input of ['', '   ', 'a'.repeat(129)]) assert.equal(modifyPassword(input), '');
  });
  it('does not replace an already strong password', function () {
    assert.equal(modifyPassword('correct horse battery staple'), '');
  });
  it('suggests policy-length passwords with a strictly higher strength score', function () {
    for (const password of ['password', '123456', 'hello']) {
      const suggestion = modifyPassword(password);
      assert.ok(suggestion);
      assert.ok(Array.from(suggestion).length >= 15 && Array.from(suggestion).length <= 128);
      assert.ok(zxcvbn(suggestion).score > zxcvbn(password).score);
    }
  });
});
