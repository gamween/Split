// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TipSplitter {
    struct Recipient {
        address addr;
        uint96 shareBps; // parts en basis points
    }

    mapping(address => Recipient[]) public splits;

    event TipDistributed(address indexed sender, address indexed owner, uint256 amount);

    function setSplit(Recipient[] calldata _recipients) external {
        delete splits[msg.sender];
        uint256 total;
        for (uint256 i = 0; i < _recipients.length; i++) {
            require(_recipients[i].addr != address(0), "invalid addr");
            total += _recipients[i].shareBps;
            splits[msg.sender].push(_recipients[i]);
        }
        require(total == 10_000, "total must be 100%");
    }

    function deposit(address owner) external payable {
        require(splits[owner].length > 0, "no split set");
        uint256 amount = msg.value;
        for (uint256 i = 0; i < splits[owner].length; i++) {
            Recipient memory r = splits[owner][i];
            uint256 share = (amount * r.shareBps) / 10_000;
            payable(r.addr).transfer(share);
        }
        emit TipDistributed(msg.sender, owner, amount);
    }

    function getSplit(address user) external view returns (Recipient[] memory) {
        return splits[user];
    }
}