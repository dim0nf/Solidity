// SPDX-License-Identifier: MIT
// Author: @Dim0nf

pragma solidity ^0.8.0;

contract Donation {

    address owner;
    mapping (address => uint) public payments;
    address[] public users;

    constructor () {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "you are not an owner!");
        _;
    }

    function acceptanceDonation () external payable {
        if (payments[msg.sender] > 0) {
           }
        else {
            users.push(msg.sender);
        }
        payments[msg.sender] += msg.value;
    }

    function withdraw () external onlyOwner {
        address payable _adr = payable(0x70997970C51812dc3A010C7d01b50e0d17dc79C8);
        _adr.transfer(address(this).balance);
    }

     // следующие две функции написаны, для удобства отладки в Hardhat
     // но они использовались и в hardhat test
    function getBalance () external view returns(uint) {
        return address(this).balance;
    }

    function getLength() external view returns(uint){
        return (users.length);
    }

}
