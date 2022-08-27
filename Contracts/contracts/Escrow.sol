//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./interfaces/IERC20.sol";
import "./interfaces/IWETHGateway.sol";

contract Escrow {
    address arbiter;
    address depositor;
    address beneficiary;
    uint256 initialDeposit;
    
    IWETHGateway gateway = IWETHGateway(0xDcD33426BA191383f1c9B431A342498fdac73488);
    IERC20 aWETH = IERC20(0x030bA81f1c18d280636F32af80b9AAd02Cf0854e);

    constructor(address _arbiter, address _beneficiary, uint256 _amount) payable {
        arbiter = _arbiter;
        beneficiary = _beneficiary;
        depositor = msg.sender;
        initialDeposit = _amount;

        // TODO: Deposit ETH through the WETH gateway
        gateway.depositETH{value: address(this).balance}(address(this), 0);
        
    }

    receive() external payable {}

    function approve() external {
        require(msg.sender == arbiter);
        uint balance = aWETH.balanceOf(address(this));
        aWETH.approve(address(gateway), balance);

        gateway.withdrawETH(type(uint256).max, address(this));
        payable(beneficiary).transfer(initialDeposit);

        payable(depositor).transfer(address(this).balance);
    }
}