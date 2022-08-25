// SPDX-License-Identifier: BSD 3-Clause License
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./SavingCircle.sol";

contract Main is AccessControl {
    address public devFund = 0xC0c630f5c9A78A75a92617852AD0F4E80BF252Cf; // Daiana's Dev Acct

    event SavingCircleCreated(SavingCircle newSavingCircle);

    constructor() public {
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
        SavingCircle newSavingCircle = new SavingCircle (  
                                    _saveAmountPerRound, 
                                    _groupSize,
                                    msg.sender, // Host of Saving Circle
                                    _payTime,
                                    devFund
                                );
        emit SavingCircleCreated(newSavingCircle);
        return address(newSavingCircle);
    }

    function setDevFundAddress (address _devFund) public onlyRole(DEFAULT_ADMIN_ROLE) {
        devFund = _devFund;
    }

}