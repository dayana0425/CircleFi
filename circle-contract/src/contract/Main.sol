// SPDX-License-Identifier: BSD 3-Clause License
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/IAccessControl.sol";
import "./SavingCircles.sol";

contract Main is AccessControl {
    // **state variables**
    address public devFund = 0xC0c630f5c9A78A75a92617852AD0F4E80BF252Cf; // Daiana's Dev Acct
    IAccessControl public ac; // Contract module that allows children to implement role-based access control mechanisms.  

    // **events**
    event RoundCreated(SavingGroups childRound);

    // **constructor**
    constructor() public {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // **contract functions**

    /* 
    Create a saving circle:
    - user that creates the saving circle will have the administrator role
    - they must indicate: the number of guests, the amount of the payment(per round), the periodicity, invite others to participate in their round

    - Take into account that you will not be able to modify this data
    - Each guest can only register for one round of the circle
    */
    function createSavingCircle (   
                        uint256 _SavingAmountPerRound, // The Payment Each To Make Per Round
                        uint256 _groupSize, // Number of Participants
                        uint256 _payTime, // Number Of Days They Have To Pay For Each Round (Ex: Weekly = 7)
    ) external payable returns(address) {
        ac=IAccessControl(_mainAddr); 
        SavingGroups newRound = new SavingGroups (  
                                    _SavingAmountPerRound, 
                                    _groupSize,
                                    msg.sender, // Host of Saving Circle
                                    _payTime,
                                    devFund
                                );
        ac.grantRole(msg.sender, address(newRound)); 
        emit RoundCreated(newRound);
        return address(newRound);
    }

    function setDevFundAddress (address _devFund) public onlyRole(DEFAULT_ADMIN_ROLE){//admin 0x0000000000000000000000000000000000000000000041444d494e5f524f4c45
        devFund = _devFund;
    }

    function setFee (uint256 _fee) public onlyRole(DEFAULT_ADMIN_ROLE){//admin 0x0000000000000000000000
        fee = _fee;
    }

}