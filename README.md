# Spl!t

## Built for Base Batches Builder Track

Spl!t was developed as part of the Base Batches Builder Track, a competition focused on building practical onchain applications on Base. The Builder Track challenges developers to create tools that solve real-world problems using smart contracts and onchain infrastructure. Spl!t addresses the fundamental friction in shared payments by making splits automatic, trustless, and invisible—turning coordination overhead into a one-time setup that works forever.

## The problem Spl!t solves

Spl!t solves the core problem of shared payments without adding layers of features or coordination. Most "split" apps try to track bills, receipts, chats, reminders, or social context — but in reality, the common need is far simpler: one shared payment that automatically routes to everyone, correctly, every time. Spl!t is intentionally minimal: you define the split once, receive a single reusable on-chain address, and any funds sent to it are instantly distributed according to the predefined bps. No reminders, no spreadsheets, no manual math, no social friction. The split becomes invisible because it is built into the payment itself.

## Challenges I ran into

I'm new to Solidity/Base, so deploying safely and wiring wallets, factories, and tooling was a learning curve. The hardest piece was the forwarder: a factory that deterministically creates a unique receive address for each owner, then routes incoming funds to recipients by bps without extra signatures. Getting correctness around rounding, reentrancy, and efficient payouts took trial, tests, and several refactors, but once stable it unlocked the "send once, split automatically" experience.

## Link to the GitHub Repo

https://github.com/gamween/Split

## Live URL

https://split-q4x9i7223-gamween-7559s-projects.vercel.app

## Video presentation

https://youtu.be/WiZuRljU_XE

## What is Spl!t's unique value proposition?

Spl!t turns any group into a single payable address that auto-routes funds on receipt. Set the split once, share the address forever, and every payment is distributed on-chain by bps with full transparency. Unlike tools that require custodians, CSV uploads, or post-payment reimbursements, Spl!t is trustless, stateless for senders, and friction-free for receivers. The product proves it end-to-end: define recipients, get an address, pay it, and funds arrive split instantly.

## Who is the target customer?

Small groups that repeatedly share money: friends and roommates, tip pools and service teams, creators and collaborators. In all cases one person usually becomes the banker. Spl!t eliminates that role by giving the group a reusable payment target that pays everyone fairly by design.

## Who are the closest competitors and how is Spl!t different?

Closest adjacent projects in the Base Batches track include SplitBill (https://splitbillbase.vercel.app) and Splitmaster (https://splitbase-tau.vercel.app). Both focus on coordinating the splitting moment: tracking items, managing groups, embedding in chats, or adding social/payment context. Spl!t does not do any of that. Spl!t only solves one thing: a deterministic on-chain forwarder that routes funds at the moment of payment. No bill screens, no chat, no escrow, no reminders. This is not "manage the split later," it is remove the need to split in the first place. Where others add workflow around the payment, Spl!t erases the workflow entirely.

## What is the distribution strategy and why?

Community-first and simplicity-first. Start in Base and Farcaster circles where group payments already happen. One person using Spl!t exposes it to everyone they transact with, so adoption is built into usage. No paid acquisition. Clear docs, a Mini App entry point, and a 15-second demo are enough to seed organic growth.
