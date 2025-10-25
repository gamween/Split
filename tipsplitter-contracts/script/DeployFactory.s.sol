// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/ForwarderFactory.sol";

contract DeployFactory is Script {
    function run() external {
        address tipSplitter = vm.envAddress("TIP_SPLITTER");
        
        vm.startBroadcast();
        
        ForwarderFactory factory = new ForwarderFactory(tipSplitter);
        
        vm.stopBroadcast();
        
        console.log("ForwarderFactory deployed at:", address(factory));
        console.log("TipSplitter address:", tipSplitter);
    }
}
