// SPDX-License-Identifier: MIT
// Author: @Dim0nf

pragma solidity ^0.8.0;
import { IDonation } from "./IDonation.sol";

contract Donation is IDonation{

    address payable immutable owner;
    mapping (address => uint) public payments;

    constructor () {
        owner = payable(msg.sender);
    }

    function acceptDonation () external payable {
        require(msg.value != 0, "zero value" );
        payments[msg.sender] += msg.value;
        emit Donation(msg.sender, msg.value);
    }

    function withdraw (address payable _addr, uint256 _amount) external {
        require(msg.sender == owner, "you are not an owner!");
        if (_addr == address(0)) _addr = owner;
        if (_amount == 0 ) _amount = address(this).balance;
        if (_amount > address(this).balance ) _amount = address(this).balance;
        (bool success,) = _addr.call{value: _amount}(new bytes(0));
        require(success, "failed to withdraw");
        emit Withdrawall(_addr, _amount);
    }

    function withdrawMembers (uint256 _amount) external {
        require(address(this).balance > 0, "contact zero balance");
        address payable _addr = payable(msg.sender);
        if (_amount  > payments[msg.sender]) _amount = payments[msg.sender];
        if (_amount > address(this).balance) _amount = address(this).balance;
        payments[msg.sender] -= _amount;
        (bool success,) = _addr.call{value: _amount}(new bytes(0));
        require(success, "failed to withdraw");
        emit WithdrawMembers(msg.sender, _amount);
    }
}