// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {TipSplitter} from "../src/TipSplitter.sol";

contract TipSplitterTest is Test {
    TipSplitter public tipSplitter;

    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    address public user = address(0x4);

    event TipDistributed(
        address indexed sender,
        address indexed owner,
        uint256 amount
    );

    event SplitUpdated(address indexed owner, uint256 recipientsCount);

    function setUp() public {
        tipSplitter = new TipSplitter();

        // Donner de l'ETH aux adresses de test
        vm.deal(user, 100 ether);
        vm.deal(alice, 1 ether);
        vm.deal(bob, 1 ether);
    }

    function test_SetSplit_Success() public {
        // Configuration: Alice 50%, Bob 30%, Charlie 20%
        TipSplitter.Recipient[] memory recipients = new TipSplitter.Recipient[](
            3
        );
        recipients[0] = TipSplitter.Recipient({addr: alice, shareBps: 5000});
        recipients[1] = TipSplitter.Recipient({addr: bob, shareBps: 3000});
        recipients[2] = TipSplitter.Recipient({addr: charlie, shareBps: 2000});

        vm.prank(user);
        vm.expectEmit(true, false, false, true);
        emit SplitUpdated(user, 3);
        tipSplitter.setSplit(recipients);

        // Vérifier que la configuration est bien enregistrée
        TipSplitter.Recipient[] memory saved = tipSplitter.getSplit(user);
        assertEq(saved.length, 3);
        assertEq(saved[0].addr, alice);
        assertEq(saved[0].shareBps, 5000);
        assertEq(saved[1].addr, bob);
        assertEq(saved[1].shareBps, 3000);
        assertEq(saved[2].addr, charlie);
        assertEq(saved[2].shareBps, 2000);
    }

    function test_SetSplit_InvalidTotal() public {
        // Total = 9000 bps (pas 10000)
        TipSplitter.Recipient[] memory recipients = new TipSplitter.Recipient[](
            2
        );
        recipients[0] = TipSplitter.Recipient({addr: alice, shareBps: 5000});
        recipients[1] = TipSplitter.Recipient({addr: bob, shareBps: 4000});

        vm.prank(user);
        vm.expectRevert("Total shares must equal 10000 bps");
        tipSplitter.setSplit(recipients);
    }

    function test_SetSplit_EmptyList() public {
        TipSplitter.Recipient[] memory recipients = new TipSplitter.Recipient[](
            0
        );

        vm.prank(user);
        vm.expectRevert("Recipients list cannot be empty");
        tipSplitter.setSplit(recipients);
    }

    function test_SetSplit_ZeroAddress() public {
        TipSplitter.Recipient[] memory recipients = new TipSplitter.Recipient[](
            2
        );
        recipients[0] = TipSplitter.Recipient({
            addr: address(0),
            shareBps: 5000
        });
        recipients[1] = TipSplitter.Recipient({addr: bob, shareBps: 5000});

        vm.prank(user);
        vm.expectRevert("Recipient address cannot be zero");
        tipSplitter.setSplit(recipients);
    }

    function test_SetSplit_ZeroShare() public {
        TipSplitter.Recipient[] memory recipients = new TipSplitter.Recipient[](
            2
        );
        recipients[0] = TipSplitter.Recipient({addr: alice, shareBps: 10000});
        recipients[1] = TipSplitter.Recipient({addr: bob, shareBps: 0});

        vm.prank(user);
        vm.expectRevert("Share must be greater than 0");
        tipSplitter.setSplit(recipients);
    }

    function test_Deposit_Success() public {
        // Configuration du split
        TipSplitter.Recipient[] memory recipients = new TipSplitter.Recipient[](
            3
        );
        recipients[0] = TipSplitter.Recipient({addr: alice, shareBps: 5000});
        recipients[1] = TipSplitter.Recipient({addr: bob, shareBps: 3000});
        recipients[2] = TipSplitter.Recipient({addr: charlie, shareBps: 2000});

        vm.prank(user);
        tipSplitter.setSplit(recipients);

        // Sauvegarder les balances avant
        uint256 aliceBalanceBefore = alice.balance;
        uint256 bobBalanceBefore = bob.balance;
        uint256 charlieBalanceBefore = charlie.balance;

        // Déposer 10 ETH
        vm.prank(user);
        vm.expectEmit(true, true, false, true);
        emit TipDistributed(user, user, 10 ether);
        tipSplitter.deposit{value: 10 ether}();

        // Vérifier les distributions
        assertEq(alice.balance, aliceBalanceBefore + 5 ether); // 50%
        assertEq(bob.balance, bobBalanceBefore + 3 ether); // 30%
        assertEq(charlie.balance, charlieBalanceBefore + 2 ether); // 20%

        // Le contrat ne doit pas garder d'ETH
        assertEq(address(tipSplitter).balance, 0);
    }

    function test_Deposit_NoConfiguration() public {
        vm.prank(user);
        vm.expectRevert("Split configuration is empty");
        tipSplitter.deposit{value: 1 ether}();
    }

    function test_Deposit_ZeroAmount() public {
        // Configuration du split
        TipSplitter.Recipient[] memory recipients = new TipSplitter.Recipient[](
            2
        );
        recipients[0] = TipSplitter.Recipient({addr: alice, shareBps: 5000});
        recipients[1] = TipSplitter.Recipient({addr: bob, shareBps: 5000});

        vm.prank(user);
        tipSplitter.setSplit(recipients);

        vm.prank(user);
        vm.expectRevert("Deposit amount must be greater than 0");
        tipSplitter.deposit{value: 0}();
    }

    function test_DepositFor_Success() public {
        // Alice configure son split
        TipSplitter.Recipient[] memory recipients = new TipSplitter.Recipient[](
            2
        );
        recipients[0] = TipSplitter.Recipient({addr: bob, shareBps: 6000});
        recipients[1] = TipSplitter.Recipient({addr: charlie, shareBps: 4000});

        vm.prank(alice);
        tipSplitter.setSplit(recipients);

        // User envoie de l'ETH pour Alice
        uint256 bobBalanceBefore = bob.balance;
        uint256 charlieBalanceBefore = charlie.balance;

        vm.prank(user);
        vm.expectEmit(true, true, false, true);
        emit TipDistributed(user, alice, 5 ether);
        tipSplitter.depositFor{value: 5 ether}(alice);

        // Vérifier les distributions selon la config d'Alice
        assertEq(bob.balance, bobBalanceBefore + 3 ether); // 60%
        assertEq(charlie.balance, charlieBalanceBefore + 2 ether); // 40%
        assertEq(address(tipSplitter).balance, 0);
    }

    function test_DepositFor_NoConfiguration() public {
        vm.prank(user);
        vm.expectRevert("Split configuration is empty");
        tipSplitter.depositFor{value: 1 ether}(alice);
    }

    function test_GetSplit() public {
        // Aucune configuration au départ
        TipSplitter.Recipient[] memory empty = tipSplitter.getSplit(user);
        assertEq(empty.length, 0);

        // Ajouter une configuration
        TipSplitter.Recipient[] memory recipients = new TipSplitter.Recipient[](
            2
        );
        recipients[0] = TipSplitter.Recipient({addr: alice, shareBps: 7000});
        recipients[1] = TipSplitter.Recipient({addr: bob, shareBps: 3000});

        vm.prank(user);
        tipSplitter.setSplit(recipients);

        // Récupérer la configuration
        TipSplitter.Recipient[] memory saved = tipSplitter.getSplit(user);
        assertEq(saved.length, 2);
        assertEq(saved[0].addr, alice);
        assertEq(saved[0].shareBps, 7000);
        assertEq(saved[1].addr, bob);
        assertEq(saved[1].shareBps, 3000);
    }

    function test_GetSplitLength() public {
        assertEq(tipSplitter.getSplitLength(user), 0);

        TipSplitter.Recipient[] memory recipients = new TipSplitter.Recipient[](
            3
        );
        recipients[0] = TipSplitter.Recipient({addr: alice, shareBps: 4000});
        recipients[1] = TipSplitter.Recipient({addr: bob, shareBps: 3000});
        recipients[2] = TipSplitter.Recipient({addr: charlie, shareBps: 3000});

        vm.prank(user);
        tipSplitter.setSplit(recipients);

        assertEq(tipSplitter.getSplitLength(user), 3);
    }

    function test_UpdateSplit() public {
        // Configuration initiale
        TipSplitter.Recipient[] memory recipients1 = new TipSplitter.Recipient[](
            2
        );
        recipients1[0] = TipSplitter.Recipient({addr: alice, shareBps: 5000});
        recipients1[1] = TipSplitter.Recipient({addr: bob, shareBps: 5000});

        vm.prank(user);
        tipSplitter.setSplit(recipients1);

        // Nouvelle configuration
        TipSplitter.Recipient[]
            memory recipients2 = new TipSplitter.Recipient[](1);
        recipients2[0] = TipSplitter.Recipient({
            addr: charlie,
            shareBps: 10000
        });

        vm.prank(user);
        tipSplitter.setSplit(recipients2);

        // Vérifier que l'ancienne config est remplacée
        TipSplitter.Recipient[] memory saved = tipSplitter.getSplit(user);
        assertEq(saved.length, 1);
        assertEq(saved[0].addr, charlie);
        assertEq(saved[0].shareBps, 10000);
    }

    function test_Receive_Success() public {
        // Configuration du split
        TipSplitter.Recipient[] memory recipients = new TipSplitter.Recipient[](
            2
        );
        recipients[0] = TipSplitter.Recipient({addr: alice, shareBps: 6000});
        recipients[1] = TipSplitter.Recipient({addr: bob, shareBps: 4000});

        vm.prank(user);
        tipSplitter.setSplit(recipients);

        // Envoi direct d'ETH au contrat
        uint256 aliceBalanceBefore = alice.balance;
        uint256 bobBalanceBefore = bob.balance;

        vm.prank(user);
        (bool success, ) = address(tipSplitter).call{value: 2 ether}("");
        assertTrue(success);

        // Vérifier les distributions
        assertEq(alice.balance, aliceBalanceBefore + 1.2 ether); // 60%
        assertEq(bob.balance, bobBalanceBefore + 0.8 ether); // 40%
        assertEq(address(tipSplitter).balance, 0);
    }

    function test_Fuzz_Deposit(uint96 amount) public {
        vm.assume(amount > 0);
        vm.assume(amount < 100 ether);

        // Configuration: 50/50
        TipSplitter.Recipient[] memory recipients = new TipSplitter.Recipient[](
            2
        );
        recipients[0] = TipSplitter.Recipient({addr: alice, shareBps: 5000});
        recipients[1] = TipSplitter.Recipient({addr: bob, shareBps: 5000});

        vm.prank(user);
        tipSplitter.setSplit(recipients);

        vm.deal(user, amount);

        uint256 aliceBalanceBefore = alice.balance;
        uint256 bobBalanceBefore = bob.balance;

        vm.prank(user);
        tipSplitter.deposit{value: amount}();

        // Vérifier que tout l'ETH a été distribué
        assertEq(address(tipSplitter).balance, 0);

        // Vérifier que la somme des distributions = montant envoyé
        uint256 totalDistributed = (alice.balance - aliceBalanceBefore) +
            (bob.balance - bobBalanceBefore);
        assertEq(totalDistributed, amount);
    }
}
