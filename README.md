# Blockchain Authentication and Password Modification Application

## Introduction

This project is a secure, blockchain-based authentication system that analyzes and optionally strengthens user passwords before storing their hashed versions on-chain. It ensures that user credentials are protected using modern cryptography and decentralized infrastructure.


## Tech Stack

* **Frontend**: React
* **Smart Contracts**: Solidity
* **Development Environment**: Hardhat
* **Blockchain Interaction**: Ethers.js
* **Password Hashing**: `keccak256` with `toUtf8Bytes` from `ethers/lib/utils`


## Key Features

###  User Registration

* Users input a password.
* The password is analyzed for strength.
* If weak, a stronger version is suggested (user may copy it).
* Only the final user-entered password is used.
* Password is hashed with `keccak256` and stored on the blockchain via a smart contract.
* Emits a `UserRegistered` event upon success.

### User Login

* Users input their password.
* Password is hashed and verified against the stored on-chain hash.
* Emits `LoginSuccessful` or `LoginFailed` event based on validation.

### Password Analysis & Strengthening

* Checks password against a dictionary of weak passwords.
* Uses Levenshtein distance to detect similarity.
* Suggests stronger passwords using:

  * Leetspeak transformations
  * Capitalization
  * Reordering characters
  * Adding delimiters
  * Prefixes and suffixes

### Public Ledger Viewer

* Dedicated React component to display login attempts
* Helps visualize blockchain activity and enhances transparency.


## Security Design

* No plaintext passwords stored.
* Strong cryptographic hashing using `keccak256`.
* Passwords are only known to users.
* Blockchain ensures data is decentralized and immutable.


## Docker Containerization

*Easy testing and deployment

## Future Improvements 

* Integrate Zero-Knowledge Proofs for enhanced privacy.
* Containerize application using Docker for easier deployment.
* Expand smart contract to support password change or recovery.


## Project Structure

* `components/` – React UI components (e.g., Navbar, Layout, PasswordAnalysis)
* `pages/` – Login, Register, Home, FAQs, LedgerViewer
* `utils/` – Hashing logic and password modification helpers
* `contracts/` – Solidity smart contracts (AuthManager)
* `artifacts/` – Compiled contract ABIs
* `vite.config.js` – Project configuration for Vite bundler

