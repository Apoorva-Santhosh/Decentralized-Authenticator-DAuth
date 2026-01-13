const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const AuthManager = await hre.ethers.getContractFactory("AuthManager");
  const authManager = await AuthManager.deploy();

  await authManager.deployed(); 
  console.log("AuthManager deployed to:", authManager.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
