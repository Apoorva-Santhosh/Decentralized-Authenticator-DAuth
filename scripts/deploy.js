async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const AuthManager = await ethers.getContractFactory("AuthManager");
  const authManager = await AuthManager.deploy();

  await authManager.waitForDeployment(); 
  console.log("AuthManager deployed to:", await authManager.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
