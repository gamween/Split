# Spl!t — Split payments effortlessly

Minimal Farcaster mini-app + smart contracts to split a tip among multiple addresses on Base.

## Live / Demo
- Local dev: `npm run dev` in `split-app/` (http://localhost:3000)
- Optional: add your deployed URL here if available.

## Architecture
- `split-app/` — Next.js (App Router). Pages:
  - `/` home
  - `/sender` set split → send tip
  - `/receiver` save split → get unique address / payment link
- `tipsplitter-contracts/` — Foundry Solidity:
  - `TipSplitter.sol` with `setSplit(owner, recipients)` and `deposit(owner)` (ETH split by bps)
  - `Forwarder.sol` + `ForwarderFactory.sol` for deterministic unique receiver addresses via CREATE2

## Contracts
- Base Sepolia `TipSplitter`: **0x06b68a99C83319cB546939023cfc92CdeF046Ee8**
- Base Sepolia `ForwarderFactory`: **[Run deployment script to get address]**
- Base mainnet: **TBD** (deploy after testing)

### How Unique Addresses Work
Each receiver gets a deterministic forwarder address via CREATE2:
1. Factory computes `forwarderAddress(owner)` without deploying
2. On first use, `getOrDeploy(owner)` deploys a minimal `Forwarder` contract
3. Any ETH sent to the forwarder is automatically forwarded to `TipSplitter.deposit(owner)` and split per saved config
4. Address is deterministic and can be computed before first funding
5. View on BaseScan: `https://sepolia.basescan.org/address/<forwarder-address>`

## Run locally (frontend)
```bash
cd split-app
# Set in .env.local:
# NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
# NEXT_PUBLIC_CONTRACT=0x06b68a99C83319cB546939023cfc92CdeF046Ee8
# NEXT_PUBLIC_FACTORY=<factory-address-from-deployment>
npm install
npm run dev
```

## Deploy contracts (Foundry)

### Deploy TipSplitter (if needed)
```bash
cd tipsplitter-contracts
forge create src/TipSplitter.sol:TipSplitter \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

### Deploy ForwarderFactory
```bash
cd tipsplitter-contracts
# Set in .env:
# TIP_SPLITTER=0x06b68a99C83319cB546939023cfc92CdeF046Ee8
# BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
# PRIVATE_KEY=your-key
forge script script/DeployFactory.s.sol:DeployFactory \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast
```

The script will output the factory address. Add it to your frontend `.env.local` as `NEXT_PUBLIC_FACTORY`.

## How it works (short)
1. **Receiver** sets recipients with shares (basis points, total 10000 = 100%)
2. Receiver generates a unique payment address via the ForwarderFactory
3. **Sender** sends ETH to the unique address
4. Forwarder contract automatically forwards to TipSplitter which splits and distributes
5. Each recipient receives their share instantly

The unique address is deterministic (CREATE2), so it can be computed and shared before receiving any funds.

## Tech stack
- Next.js + TypeScript, wagmi/viem
- Solidity + Foundry
- Base (Sepolia / Mainnet)

## Folder structure
```
BB25/
  split-app/               # frontend
  tipsplitter-contracts/   # solidity + scripts
  package.json
```

## Notes
- No wallet connect button required; UI accepts owner address directly.
- BPS must sum to 10000.
- Use testnet first; switch NEXT_PUBLIC_RPC_URL for mainnet.

## License
MIT
