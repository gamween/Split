// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/TipSplitter.sol";

contract DeployTipSplitter is Script {
    function run() external {
        vm.startBroadcast();
        
        TipSplitter tipSplitter = new TipSplitter();
        
        vm.stopBroadcast();
        
        console.log("TipSplitter deployed at:", address(tipSplitter));
    }
}
