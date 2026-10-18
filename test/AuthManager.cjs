const assert = require('node:assert/strict');
const { ethers } = require('hardhat');

describe('AuthManager public wallet registry', function () {
  let contract, user, otherUser;
  beforeEach(async function () {
    [user, otherUser] = await ethers.getSigners();
    contract = await (await ethers.getContractFactory('AuthManager')).deploy();
    await contract.deployed();
  });
  it('records the sender and emits its address without credential data', async function () {
    assert.equal(await contract.isRegistered(user.address), false);
    const receipt = await (await contract.register()).wait();
    assert.equal(await contract.isRegistered(user.address), true);
    assert.equal(await contract.isRegistered(otherUser.address), false);
    const event = receipt.events.find((item) => item.event === 'UserRegistered');
    assert.equal(event.args.user, user.address);
    assert.equal(event.args.length, 1);
    assert.equal(contract.interface.getFunction('register').inputs.length, 0);
    assert.equal(Object.keys(contract.interface.functions).some((name) => name.startsWith('login(')), false);
  });
  it('rejects a duplicate registration', async function () {
    await (await contract.register()).wait();
    await assert.rejects(contract.register(), /User already registered/);
  });
  it('records different wallets independently', async function () {
    await (await contract.connect(otherUser).register()).wait();
    assert.equal(await contract.isRegistered(user.address), false);
    assert.equal(await contract.isRegistered(otherUser.address), true);
  });
});
