// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./Forwarder.sol";

contract ForwarderFactory {
    address public immutable tipSplitter;

    event ForwarderDeployed(address indexed owner, address indexed forwarder);

    constructor(address _tipSplitter) {
        tipSplitter = _tipSplitter;
    }

    function forwarderAddress(address owner) public view returns (address) {
        bytes32 salt = keccak256(abi.encode(owner));
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(abi.encodePacked(type(Forwarder).creationCode, abi.encode(tipSplitter, owner)))
            )
        );
        return address(uint160(uint256(hash)));
    }

    function deploy(address owner) external returns (address fwd) {
        bytes32 salt = keccak256(abi.encode(owner));
        fwd = address(new Forwarder{salt: salt}(tipSplitter, owner));
        emit ForwarderDeployed(owner, fwd);
    }

    function getOrDeploy(address owner) external returns (address fwd) {
        fwd = forwarderAddress(owner);
        if (fwd.code.length == 0) {
            bytes32 salt = keccak256(abi.encode(owner));
            fwd = address(new Forwarder{salt: salt}(tipSplitter, owner));
            emit ForwarderDeployed(owner, fwd);
        }
    }
}
