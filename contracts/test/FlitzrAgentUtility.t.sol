// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {FlitzrAgentUtility} from "../FlitzrAgentUtility.sol";

contract FlitzrAgentUtilityTest is Test {
    FlitzrAgentUtility token;

    address treasury = makeAddr("treasury");
    address admin = makeAddr("admin");
    address agent = makeAddr("agent");
    address recipient = makeAddr("recipient");
    address attacker = makeAddr("attacker");

    uint256 constant LIMIT = 100 ether;

    function setUp() public {
        token = new FlitzrAgentUtility(treasury, admin);
    }

    function testInitialSupplyGoesToTreasury() public view {
        assertEq(token.totalSupply(), 1_000_000_000 ether);
        assertEq(token.balanceOf(treasury), 1_000_000_000 ether);
        assertEq(token.treasury(), treasury);
        assertEq(token.name(), "Flitzr Agent Utility");
        assertEq(token.symbol(), "FLITZR");
        assertEq(token.decimals(), 18);
    }

    function testConstructorRejectsZeroAddresses() public {
        vm.expectRevert(FlitzrAgentUtility.ZeroAddress.selector);
        new FlitzrAgentUtility(address(0), admin);

        vm.expectRevert(FlitzrAgentUtility.ZeroAddress.selector);
        new FlitzrAgentUtility(treasury, address(0));
    }

    function testOnlyAgentAdminCanConfigureAgents() public {
        vm.prank(attacker);
        vm.expectRevert();
        token.setAgentPolicy(agent, LIMIT, true);

        vm.prank(admin);
        token.setAgentPolicy(agent, LIMIT, true);
        assertTrue(token.hasRole(token.AGENT_ROLE(), agent));
    }

    function testAgentCannotSpendWithoutTreasuryAllowance() public {
        vm.prank(admin);
        token.setAgentPolicy(agent, LIMIT, true);

        vm.prank(agent);
        vm.expectRevert();
        token.agentPay(recipient, 1 ether, keccak256("no-allowance"));
    }

    function testAgentPaymentUsesTreasuryAndTracksLimit() public {
        vm.prank(admin);
        token.setAgentPolicy(agent, LIMIT, true);

        vm.prank(treasury);
        token.approve(address(token), LIMIT);

        vm.prank(agent);
        token.agentPay(recipient, 40 ether, keccak256("payment-1"));

        assertEq(token.balanceOf(recipient), 40 ether);
        assertEq(token.balanceOf(treasury), 1_000_000_000 ether - 40 ether);

        (uint256 limit, uint256 spent, bool enabled) = token.agentPolicies(agent);
        assertEq(limit, LIMIT);
        assertEq(spent, 40 ether);
        assertTrue(enabled);
        assertEq(token.allowance(treasury, address(token)), 60 ether);
    }

    function testAgentCannotExceedConfiguredLimit() public {
        vm.prank(admin);
        token.setAgentPolicy(agent, LIMIT, true);

        vm.prank(treasury);
        token.approve(address(token), type(uint256).max);

        vm.prank(agent);
        token.agentPay(recipient, 60 ether, keccak256("payment-1"));

        vm.prank(agent);
        vm.expectRevert(
            abi.encodeWithSelector(FlitzrAgentUtility.AgentLimitExceeded.selector, 41 ether, 40 ether)
        );
        token.agentPay(recipient, 41 ether, keccak256("payment-too-large"));
    }

    function testDisabledAgentCannotPay() public {
        vm.startPrank(admin);
        token.setAgentPolicy(agent, LIMIT, true);
        token.setAgentPolicy(agent, LIMIT, false);
        vm.stopPrank();

        assertFalse(token.hasRole(token.AGENT_ROLE(), agent));

        vm.prank(agent);
        vm.expectRevert();
        token.agentPay(recipient, 1 ether, keccak256("disabled"));
    }

    function testAgentCannotSpendFromAnotherAddress() public {
        vm.prank(admin);
        token.setAgentPolicy(agent, LIMIT, true);

        address otherTreasury = makeAddr("otherTreasury");
        vm.prank(otherTreasury);
        vm.expectRevert();
        token.approve(address(token), LIMIT);

        vm.prank(treasury);
        token.approve(address(token), LIMIT);

        vm.prank(agent);
        token.agentPay(recipient, 1 ether, keccak256("only-configured-treasury"));

        assertEq(token.balanceOf(otherTreasury), 0);
        assertEq(token.balanceOf(recipient), 1 ether);
    }

    function testAdminCanResetAgentSpend() public {
        vm.prank(admin);
        token.setAgentPolicy(agent, LIMIT, true);

        vm.prank(treasury);
        token.approve(address(token), type(uint256).max);

        vm.prank(agent);
        token.agentPay(recipient, LIMIT, keccak256("full-limit"));

        (, uint256 spentBefore,) = token.agentPolicies(agent);
        assertEq(spentBefore, LIMIT);

        vm.prank(admin);
        token.resetAgentSpend(agent);

        (, uint256 spentAfter,) = token.agentPolicies(agent);
        assertEq(spentAfter, 0);
    }

    function testAgentCannotMint() public {
        // The contract deliberately exposes no public mint function.
        // This low-level call confirms an arbitrary mint selector is not callable.
        bytes memory callData = abi.encodeWithSignature("mint(address,uint256)", recipient, 1 ether);

        (bool success,) = address(token).call(callData);
        assertFalse(success);
        assertEq(token.totalSupply(), 1_000_000_000 ether);
    }
}
