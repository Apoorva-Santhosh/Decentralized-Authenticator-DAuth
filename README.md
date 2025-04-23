# Blockchain-Authentication-and-Password-Modification-Application

## The main objectives of the project are as follows:

- Objective 1: Design a decentralized password management system using blockchain to securely store and manage user passwords.

- Objective 2: Implement a secure authentication mechanism using blockchain, ensuring that password hashes are stored and verified in a tamper-proof manner.

- Objective 3: Develop an easy-to-use interface for users to securely register, log in, and manage passwords using blockchain-based authentication.

- Objective 4: Integrate a password analysis module that evaluates password strength, calculates entropy, and estimates password cracking time before storing it securely on the blockchain.

- Objective 5: Integrate a password modification module that automatically enhances weak passwords by applying a series of transformations to improve security before storage.



## To achieve the objectives outlined above, the following methods will be employed:

- Smart Contract Development: Smart contracts will be written in Solidity and deployed on the Ethereum testnet. These contracts will handle password hash storage and verification.

- Password Hashing: Secure hashing algorithms (e.g., SHA-256, bcrypt) will be used to hash passwords before they are stored on the blockchain. The hash will be compared during login to authenticate users.

- Password Analysis: A custom password analysis function will be created using libraries like zxcvbn.js to evaluate password strength. The system will also calculate entropy and estimate the time required for a brute-force attack on the password.

- Password Modification: The system will automatically modify weak passwords by applying random transformations such as using leetspeak, adding capital letters, inserting delimiters, reversing parts of the password, etc. This will be done before hashing and storing the password on the blockchain.

- Dictionary-based Weak Password Check: The system will check the password against a list of known weak or commonly used passwords and suggest stronger alternatives if necessary.

- User Interface: The frontend will be built using React or a similar JavaScript framework, allowing users to interact with the system for registration, login, and password management.

- Blockchain Interaction: Web3.js will be used to connect the frontend with the blockchain, enabling users to interact with the smart contracts on the testnet.

- Testing: The system will be tested on the Ethereum testnet (e.g., Rinkeby or Goerli) to simulate the blockchain interactions without incurring real transaction costs.


## The expected outcomes of this work include:

- Secure and Decentralized Authentication: A robust system for password authentication that eliminates the need for centralized storage and ensures that user data is kept secure and private.

- Password Strength Analysis: The system will automatically analyze the strength of passwords before storing them on the blockchain. This includes checking for weak passwords, calculating entropy, and estimating password cracking time.

- Password Enhancement: Weak passwords will be automatically enhanced using various techniques to increase their strength, reducing the risk of breaches.

- User-Friendly Interface: An intuitive platform for users to register, log in, and manage their passwords in a secure and decentralized manner.

- Scalable Solution: A solution that can be adapted for decentralized applications (dApps) and other platforms that require secure password management.

  
