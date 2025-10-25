# Spl!t

## The problem Spl!t solves

Spl!t solves the core problem of shared payments without adding layers of features or coordination. Most "split" apps try to track bills, receipts, chats, reminders, or social context — but in reality, the common need is far simpler: one shared payment that automatically routes to everyone, correctly, every time. Spl!t is intentionally minimal: you define the split once, receive a single reusable on-chain address, and any funds sent to it are instantly distributed according to the predefined bps. No reminders, no spreadsheets, no manual math, no social friction. The split becomes invisible because it is built into the payment itself.

## Challenges I ran into

I'm new to Solidity/Base, so deploying safely and wiring wallets, factories, and tooling was a learning curve. The hardest piece was the forwarder: a factory that deterministically creates a unique receive address for each owner, then routes incoming funds to recipients by bps without extra signatures. Getting correctness around rounding, reentrancy, and efficient payouts took trial, tests, and several refactors, but once stable it unlocked the "send once, split automatically" experience.

## Link to the GitHub Repo of your project

https://github.com/gamween/Split

## Live URL of your project

https://split-q4x9i7223-gamween-7559s-projects.vercel.app

## What is your product's unique value proposition?

Split turns any group into a single payable address that auto-routes funds on receipt. Set the split once, share the address forever, and every payment is distributed on-chain by bps with full transparency. Unlike tools that require custodians, CSV uploads, or post-payment reimbursements, Split is trustless, stateless for senders, and friction-free for receivers. The alpha proves it end-to-end: define recipients, get an address, pay it, and funds arrive split instantly.

## Who is your target customer?

Small groups that repeatedly share money: friends and roommates, tip pools and service teams, creators and collaborators. In all cases one person usually becomes the banker. Split eliminates that role by giving the group a reusable payment target that pays everyone fairly by design.

## Who are your closest competitors and how are you different?

Closest adjacent projects in the Base Batches track include SplitBill (https://splitbillbase.vercel.app) and Splitmaster (https://splitbase-tau.vercel.app). Both focus on coordinating the splitting moment: tracking items, managing groups, embedding in chats, or adding social/payment context. Spl!t does not do any of that. Spl!t only solves one thing: a deterministic on-chain forwarder that routes funds at the moment of payment. No bill screens, no chat, no escrow, no reminders. This is not "manage the split later," it is remove the need to split in the first place. Where others add workflow around the payment, Spl!t erases the workflow entirely.

## What is your distribution strategy and why?

Community-first and simplicity-first. Start in Base and Farcaster circles where group payments already happen. One person using Split exposes it to everyone they transact with, so adoption is built into usage. No paid acquisition. Clear docs, a Mini App entry point, and a 15-second demo are enough to seed organic growth.

