// SPDX-License-Identifier: MIT
// Author: @Dim0nf

pragma solidity ^0.8.17;

interface IMultiSigWallet {
    event Deposit(address indexed sender, uint amount, uint balance);
    event SubmitTransaction(
        address indexed owner,
        uint indexed txIndex,
        address indexed to,
        uint value,
        bytes data
    );
    event ConfirmTransaction(address indexed owner, uint indexed txIndex);
    event RevokeConfirmation(address indexed owner, uint indexed txIndex);
    event ExecuteTransaction(address indexed owner, uint indexed txIndex);

    receive() external payable;
    function submitTransaction(address _to, uint _value, bytes memory _data) external;
    function confirmTransaction(uint _txIndex) external;
    function executeTransaction(uint _txIndex) external;
    function revokeConfirmation(uint _txIndex) external;
    function getOwners() external view returns (address[] memory);
    function getTransactionCount() external view returns (uint);
    function getTransaction(uint _txIndex) external view
        returns (
            address to,
            uint value,
            bytes memory data,
            bool executed,
            uint numConfirmations
        );
}