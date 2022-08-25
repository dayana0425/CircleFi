// SPDX-License-Identifier: BSD 3-Clause License
pragma solidity ^0.8.0;

abstract contract Modifiers {
    modifier onlyHost(address host) {
        require(msg.sender == host, "Only the host/admin can call this function.");
        _;
    }

    modifier isRegisteredParticipant(bool user) {
        require(user == true, "User is not registered for Circle.");
        _;
    }
}