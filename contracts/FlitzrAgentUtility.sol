// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

/// @title Flitzr Agent Utility Token
/// @notice Fixed-supply $FLITZR token plus a bounded agent-payment controller.
/// @dev The agent role never receives an unrestricted minting privilege.
///      Agents can only spend tokens that the treasury explicitly approves to this contract,
///      and each agent has an on-chain spending limit enforced by this contract.
contract FlitzrAgentUtility is ERC20, ERC20Permit, ERC20Burnable, AccessControl {
    bytes32 public constant AGENT_ADMIN_ROLE = keccak256("AGENT_ADMIN_ROLE");
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 ether;

    struct AgentPolicy {
        uint256 limit;
        uint256 spent;
        bool enabled;
    }

    mapping(address => AgentPolicy) public agentPolicies;

    event AgentPolicyUpdated(address indexed agent, uint256 limit, bool enabled);
    event AgentPayment(address indexed agent, address indexed recipient, uint256 amount, bytes32 indexed reference);

    error AgentDisabled();
    error AgentLimitExceeded(uint256 requested, uint256 remaining);
    error ZeroAddress();

    constructor(address initialTreasury, address initialAdmin)
        ERC20("Flitzr Agent Utility", "FLITZR")
        ERC20Permit("Flitzr Agent Utility")
    {
        if (initialTreasury == address(0) || initialAdmin == address(0)) revert ZeroAddress();

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(AGENT_ADMIN_ROLE, initialAdmin);
        _mint(initialTreasury, INITIAL_SUPPLY);
    }

    /// @notice Configure an agent's cumulative spending ceiling.
    /// @dev The treasury should approve this contract for the amount it intends agents to spend.
    function setAgentPolicy(address agent, uint256 limit, bool enabled)
        external
        onlyRole(AGENT_ADMIN_ROLE)
    {
        if (agent == address(0)) revert ZeroAddress();

        agentPolicies[agent] = AgentPolicy({limit: limit, spent: 0, enabled: enabled});
        if (enabled) {
            _grantRole(AGENT_ROLE, agent);
        } else if (hasRole(AGENT_ROLE, agent)) {
            _revokeRole(AGENT_ROLE, agent);
        }

        emit AgentPolicyUpdated(agent, limit, enabled);
    }

    /// @notice Send $FLITZR from the approved treasury allowance to a recipient.
    /// @dev The agent can never mint tokens and cannot spend above its configured ceiling.
    function agentPay(address recipient, uint256 amount, bytes32 reference)
        external
        onlyRole(AGENT_ROLE)
    {
        if (!agentPolicies[msg.sender].enabled) revert AgentDisabled();
        if (recipient == address(0)) revert ZeroAddress();

        AgentPolicy storage policy = agentPolicies[msg.sender];
        uint256 remaining = policy.limit - policy.spent;
        if (amount > remaining) revert AgentLimitExceeded(amount, remaining);

        policy.spent += amount;
        _transfer(_msgSender(), recipient, amount);
        emit AgentPayment(msg.sender, recipient, amount, reference);
    }

    /// @notice Reset an agent's cumulative spend counter without changing its limit.
    function resetAgentSpend(address agent) external onlyRole(AGENT_ADMIN_ROLE) {
        agentPolicies[agent].spent = 0;
    }
}
