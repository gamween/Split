// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ITipSplitter {
    function depositFor(address owner) external payable;
}

contract Forwarder {
    address public immutable tipSplitter;
    address public immutable owner;

    constructor(address _tipSplitter, address _owner) {
        tipSplitter = _tipSplitter;
        owner = _owner;
    }

    receive() external payable {
        ITipSplitter(tipSplitter).depositFor{value: msg.value}(owner);
    }
}
