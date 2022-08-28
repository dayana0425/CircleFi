// SPDX-License-Identifier: BSD 3-Clause License
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./SavingCircle.sol";
import "hardhat/console.sol";

contract Main is AccessControl {
    event SavingCircleCreated(SavingCircle newSavingCircle);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /* 
    Create a Saving Circle:
        - _saveAmountPerRound: Payment per round
        - _groupSize: Number of participants
        - _payTime: Number of days each round will last (Ex: Weekly = 7)
    */
    function createSavingCircle (
        uint256 _saveAmountPerRound, 
        uint256 _groupSize, 
        uint256 _payTime
    ) external payable returns(address) {
        require(msg.value > 0, "No ETH sent");
        SavingCircle newSavingCircle = (new SavingCircle){value: msg.value}(  
                                    _saveAmountPerRound, 
                                    _groupSize,
                                    _payTime,
                                    msg.sender // Host of Saving Circle
                                );
        emit SavingCircleCreated(newSavingCircle);
        return address(newSavingCircle);
    }
}