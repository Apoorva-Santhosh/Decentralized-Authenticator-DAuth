const assert = require('node:assert/strict');
const { ethers, network } = require('hardhat');

describe('Lock', function () {
  let lock, owner, otherAccount, unlockTime;
  const lockedAmount = ethers.BigNumber.from(1_000_000_000);

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();
    const latest = await ethers.provider.getBlock('latest');
    unlockTime = latest.timestamp + 365 * 24 * 60 * 60;
    lock = await (await ethers.getContractFactory('Lock')).deploy(unlockTime, { value: lockedAmount });
    await lock.deployed();
  });

  async function unlock() {
    await network.provider.send('evm_setNextBlockTimestamp', [unlockTime]);
    await network.provider.send('evm_mine');
  }

  it('sets the unlock time and owner and receives the funds', async function () {
    assert.equal((await lock.unlockTime()).toNumber(), unlockTime);
    assert.equal(await lock.owner(), owner.address);
    assert.ok((await ethers.provider.getBalance(lock.address)).eq(lockedAmount));
  });

  it('rejects an unlock time in the past', async function () {
    const factory = await ethers.getContractFactory('Lock');
    await assert.rejects(factory.deploy(0, { value: 1 }), /Unlock time should be in the future/);
  });

  it('rejects a withdrawal before the unlock time', async function () {
    await assert.rejects(lock.withdraw(), /You can't withdraw yet/);
  });

  it('rejects a withdrawal by another account after unlocking', async function () {
    await unlock();
    await assert.rejects(lock.connect(otherAccount).withdraw(), /You aren't the owner/);
  });

  it('emits the withdrawal event and transfers the balance to the owner', async function () {
    await unlock();
    const before = await ethers.provider.getBalance(owner.address);
    const receipt = await (await lock.withdraw()).wait();
    const after = await ethers.provider.getBalance(owner.address);
    const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);
    assert.ok(after.add(gasCost).sub(before).eq(lockedAmount));
    assert.ok((await ethers.provider.getBalance(lock.address)).isZero());
    const event = receipt.events.find((item) => item.event === 'Withdrawal');
    assert.ok(event.args.amount.eq(lockedAmount));
    assert.equal(event.args.when.toNumber(), (await ethers.provider.getBlock(receipt.blockNumber)).timestamp);
  });
});
