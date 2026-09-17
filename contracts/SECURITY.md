# FLITZR Contract Security Checklist

## Before Base Mainnet

- [ ] Pin Solidity compiler version and OpenZeppelin Contracts version.
- [ ] Compile the exact source that will be deployed.
- [ ] Deploy first to Base Sepolia (chain ID 84532).
- [ ] Test fixed supply and treasury allocation.
- [ ] Test that no public mint path exists.
- [ ] Test agent enable/disable behavior.
- [ ] Test that agent payments cannot exceed the configured limit.
- [ ] Test that payments fail without treasury allowance.
- [ ] Test that an agent cannot spend from any address other than the configured treasury.
- [ ] Test admin role boundaries and zero-address validation.
- [ ] Review the treasury and admin addresses before deployment.
- [ ] Prefer a multisig for production administration rather than a single hot wallet.
- [ ] Perform an independent security review before mainnet.
- [ ] Verify the deployed source and compiler settings on the Base block explorer.

## Policy invariant

The intended invariant is:

> An agent cannot mint FLITZR and cannot transfer treasury-held FLITZR unless the treasury has explicitly approved this contract and the agent's on-chain spending policy permits the payment.

## Base networks

Base Mainnet: chain ID 8453.
Base Sepolia: chain ID 84532.

Do not put a mainnet contract address in application configuration until the deployment has passed the checklist above.
