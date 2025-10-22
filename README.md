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
  - (optional) Forwarder/Factory for unique receiver addresses

## Contracts
- Base mainnet `TipSplitter`: **TBD** (fill when deployed)
- Base Sepolia `TipSplitter`: **0x06b68a99C83319cB546939023cfc92CdeF046Ee8** (testing)

> Update the mainnet address here after deploy.

## Run locally (frontend)
```bash
cd split-app
cp .env.local.example .env.local   # if you maintain an example
# or set:
# NEXT_PUBLIC_RPC_URL=https://mainnet.base.org
# NEXT_PUBLIC_CONTRACT=0xYourMainnetAddress
npm install
npm run dev
```

## Deploy contracts (Foundry)
```bash
cd tipsplitter-contracts
# .env must define: PRIVATE_KEY, BASE_MAINNET_RPC_URL
forge build
forge create src/TipSplitter.sol:TipSplitter \
  --rpc-url base-mainnet \
  --private-key $PRIVATE_KEY \
  --broadcast
```

## How it works (short)
1. Sender sets recipients with shares (basis points, total 10000), then sends a tip.
2. Contract splits msg.value and forwards to each recipient.
3. Receiver flow can generate a unique address or a shareable link.

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
