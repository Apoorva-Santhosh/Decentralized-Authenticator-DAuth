// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

// Public wallet registry only. Password verification and sessions are off-chain.
contract AuthManager {
    mapping(address => bool) private registered;

    event UserRegistered(address indexed user);

    function register() external {
        require(!registered[msg.sender], "User already registered");
        registered[msg.sender] = true;
        emit UserRegistered(msg.sender);
    }

    function isRegistered(address user) external view returns (bool) {
        return registered[user];
    }
}
