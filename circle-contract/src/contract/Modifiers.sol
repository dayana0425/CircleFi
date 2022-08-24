// SPDX-License-Identifier: BSD 3-Clause License
pragma solidity ^0.8.0;

abstract contract Modifiers {
    modifier onlyAdmin(address admin) {
        require(msg.sender == admin, "Only the host/admin can call this function.");
        _;
    }

    modifier isRegisteredUser(bool user) {
        require(user == true, "User is not registered for Circle.");
        _;
    }
}

