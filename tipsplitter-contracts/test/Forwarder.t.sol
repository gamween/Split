// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/TipSplitter.sol";
import "../src/ForwarderFactory.sol";
import "../src/Forwarder.sol";

contract ForwarderTest is Test {
    TipSplitter public tipSplitter;
    ForwarderFactory public factory;
    
    address public owner = address(0x1);
    address public recipient1 = address(0x2);
    address public recipient2 = address(0x3);
    
    function setUp() public {
        tipSplitter = new TipSplitter();
        factory = new ForwarderFactory(address(tipSplitter));
    }
    
    function testForwarderAddress() public {
        address predicted = factory.forwarderAddress(owner);
        address deployed = factory.getOrDeploy(owner);
        assertEq(predicted, deployed, "Predicted address should match deployed");
    }
    
    function testGetOrDeployIdempotent() public {
        address fwd1 = factory.getOrDeploy(owner);
        address fwd2 = factory.getOrDeploy(owner);
        assertEq(fwd1, fwd2, "Should return same address on second call");
    }
    
    function testForwarderReceiveAndSplit() public {
        TipSplitter.Recipient[] memory recipients = new TipSplitter.Recipient[](2);
        recipients[0] = TipSplitter.Recipient({addr: recipient1, shareBps: 5000});
        recipients[1] = TipSplitter.Recipient({addr: recipient2, shareBps: 5000});
        
        vm.prank(owner);
        tipSplitter.setSplit(recipients);
        
        address forwarder = factory.getOrDeploy(owner);
        
        uint256 amount = 1 ether;
        vm.deal(address(this), amount);
        
        (bool success,) = forwarder.call{value: amount}("");
        require(success, "Send to forwarder failed");
        
        assertEq(recipient1.balance, amount / 2, "Recipient1 should receive half");
        assertEq(recipient2.balance, amount / 2, "Recipient2 should receive half");
    }
}
