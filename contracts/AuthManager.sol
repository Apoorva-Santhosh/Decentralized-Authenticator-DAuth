// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

contract AuthManager {
    struct User {
        bytes32 passwordHash;
        bool exists;
    }

    mapping(address => User) private users;

    event UserRegistered(address indexed user);
    event LoginSuccessful(address indexed user);
    event LoginFailed(address indexed user);

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
    function login(bytes32 _passwordHash) external view returns (bool) {
        if (users[msg.sender].exists && users[msg.sender].passwordHash == _passwordHash) {
            return true;
        } else {
            return false;
        }
    }

    // Check if an address is already registered
    function isRegistered(address _user) external view returns (bool) {
        return users[_user].exists;
    }
}
