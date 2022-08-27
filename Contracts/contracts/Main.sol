// SPDX-License-Identifier: BSD 3-Clause License
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./SavingCircle.sol";

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
    function createSavingCircle (uint256 _saveAmountPerRound, uint256 _groupSize, uint256 _payTime) external payable returns(address) {
        SavingCircle newSavingCircle = new SavingCircle (  
                                    _saveAmountPerRound, 
                                    _groupSize,
                                    msg.sender, // Host of Saving Circle
                                    _payTime
                                );
        emit SavingCircleCreated(newSavingCircle);
        return address(newSavingCircle);
    }
}