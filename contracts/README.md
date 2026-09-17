# FLITZR Agent Utility Contract

`FlitzrAgentUtility.sol` is the prepared onchain contract for the future `$FLITZR` utility token on Base.

## Design

- Token name: `Flitzr Agent Utility`
- Symbol: `FLITZR`
- Decimals: standard ERC-20 18
- Initial supply: `1,000,000,000 FLITZR`
- Supply is minted once in the constructor to the configured treasury.
- No public mint function exists.
- `AGENT_ADMIN_ROLE` configures agent wallets and their cumulative spending limits.
- `AGENT_ROLE` can call `agentPay`, but only within the configured limit.
- Agent payments come from treasury-held FLITZR and require an explicit ERC-20 allowance from the treasury to this contract.
- The contract uses OpenZeppelin ERC-20, ERC20Permit, ERC20Burnable and AccessControl modules.

## Important deployment rule

Do **not** deploy this contract to Base Mainnet yet. First deploy to Base Sepolia, run tests, review the constructor/admin/treasury addresses, and perform a security review.

When mainnet deployment is approved, the source should be verified on the relevant block explorer immediately after deployment. Verification means the published Solidity source/compiler settings match the bytecode deployed at the contract address; it does not itself constitute a security audit.

## Intended Flitzr flow

`User intent -> policy check -> quote/plan -> explicit wallet approval -> onchain execution -> confirmation`

The FLITZR contract is deliberately not an unrestricted autonomous minting system. The agent can only spend treasury funds that the treasury has explicitly approved to the contract, and the agent's onchain policy limits the cumulative amount.

## OpenZeppelin version

Pin the exact OpenZeppelin Contracts 5.x version in the eventual Solidity build environment before deployment. Do not change compiler or dependency versions between deployment and verification.

## Future extensions

Potential future modules should be separate contracts or carefully reviewed upgrades rather than adding arbitrary privileged functionality to the token:

- agent registry / revocation
- fee accounting
- staking/rewards
- governance
- treasury multisig / timelock
- x402 payment accounting

Any future extension must preserve the rule that an agent cannot arbitrarily mint or drain treasury funds.
