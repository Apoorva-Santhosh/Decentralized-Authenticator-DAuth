import hre from 'hardhat';
const { ethers } = hre;

async function interact() {
  const [user] = await ethers.getSigners();
  const address = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const registry = await ethers.getContractAt('AuthManager', address);
  console.log('Interacting with wallet registry using account:', user.address);
  console.log('Is registered:', await registry.isRegistered(user.address));
  // To record this wallet, use: await (await registry.register()).wait();
  // Password registration/login belongs to /api/auth, never to a transaction.
}

interact().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
