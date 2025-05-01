const { ethers } = require("hardhat");

async function interact() {
  const [user] = await ethers.getSigners();
  console.log("Interacting with contract using account:", user.address);

  const contractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; 

  const authManager = await ethers.getContractAt("AuthManager", contractAddress);

  // Check if user is already registered
  const isRegistered = await authManager.isRegistered(user.address);
  console.log("Is Registered:", isRegistered);

  /*
  // Uncomment below lines only if you want to test registration from script
  if (!isRegistered) {
    const password = "my_secure_password"; 
    const passwordHash = ethers.keccak256(ethers.toUtf8Bytes(password));
    console.log("Password Hash:", passwordHash);

    const tx = await authManager.register(passwordHash);
    await tx.wait();
    console.log("User registered successfully!");
  } else {
    console.log("User already registered.");
  }

  // Uncomment to test login from script
  const passwordToLogin = "my_secure_password"; 
  const passwordHashToLogin = ethers.keccak256(ethers.toUtf8Bytes(passwordToLogin));
  
  const loginSuccess = await authManager.login(passwordHashToLogin);
  console.log("Login Success?", loginSuccess);
  */
}

interact()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
