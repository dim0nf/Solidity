// SPDX-License-Identifier: MIT
// Author: @Dim0nf

pragma solidity ^0.8.0;

interface IDonation {
    event Donation(address indexed donor, uint256 amount);
    event Withdrawall(address indexed addr, uint256 amount);
    event WithdrawMembers(address indexed to, uint256 amount);
    function acceptDonation () external payable;
    function withdraw (address payable _addr, uint256 _amount) external;
    function withdrawMembers (uint256 _amount) external;
}