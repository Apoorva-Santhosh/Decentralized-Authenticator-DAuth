// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

contract AuthManager {
    struct User {
        bytes32 passwordHash;
        bool exists;
    }

    mapping(address => User) private users;

    event UserRegistered(address indexed user);
    event LoginAttempt(address indexed user, bool success); // Unified login event for ledger

    // Register a new user
    function register(bytes32 _passwordHash) external {
        require(!users[msg.sender].exists, "User already registered");

        users[msg.sender] = User({
            passwordHash: _passwordHash,
            exists: true
        });

        emit UserRegistered(msg.sender);
    }

    // Login: Verify user's password
    function login(bytes32 _passwordHash) external returns (bool) {
        bool success = users[msg.sender].exists && users[msg.sender].passwordHash == _passwordHash;

        emit LoginAttempt(msg.sender, success); // Record every login attempt on-chain
        return success;
    }

    // Check if an address is already registered
    function isRegistered(address _user) external view returns (bool) {
        return users[_user].exists;
    }
}
