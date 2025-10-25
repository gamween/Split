# Spl!t

## The problem Spl!t solves

Splitting onchain still means manual math, multiple sends, and trust that someone will redistribute. Split removes all coordination cost: one reusable address per group, one payment, instant trustless distribution to every recipient according to predefined bps. No spreadsheets. No chasing. Money lands correctly on-chain the first time.

## Challenges I ran into

I'm new to Solidity/Base, so deploying safely and wiring wallets, factories, and tooling was a learning curve. The hardest piece was the forwarder: a factory that deterministically creates a unique receive address for each owner, then routes incoming funds to recipients by bps without extra signatures. Getting correctness around rounding, reentrancy, and efficient payouts took trial, tests, and several refactors, but once stable it unlocked the "send once, split automatically" experience.

## Link to the GitHub Repo of your project

https://github.com/gamween/Split

## Live URL of your project

https://split-jo5ugi7pr-gamween-7559s-projects.vercel.app

## What is your product's unique value proposition?

Split turns any group into a single payable address that auto-routes funds on receipt. Set the split once, share the address forever, and every payment is distributed on-chain by bps with full transparency. Unlike tools that require custodians, CSV uploads, or post-payment reimbursements, Split is trustless, stateless for senders, and friction-free for receivers. The alpha proves it end-to-end: define recipients, get an address, pay it, and funds arrive split instantly.

## Who is your target customer?

Small groups that repeatedly share money: friends and roommates, tip pools and service teams, creators and collaborators. In all cases one person usually becomes the banker. Split eliminates that role by giving the group a reusable payment target that pays everyone fairly by design.

## Who are your closest competitors and how are you different?

Closest: Multisender (https://multisender.app) and MetaSender (https://metasender.app) for bulk distributions, and Request Finance (https://request.finance) for invoicing and ops. Those products excel at scheduled payrolls, airdrops, or accounting flows that start with a dashboard and often require repeating setup or uploading lists each time. Split is different: it serves recurring, lightweight, human-to-human payments. Configure once, then any future payment to the group's address is auto-split. It's the "last-mile" of onchain finance where social coordination matters.

## What is your distribution strategy and why?

Community-first and simplicity-first. Start in Base and Farcaster circles where group payments already happen. One person using Split exposes it to everyone they transact with, so adoption is built into usage. No paid acquisition. Clear docs, a Mini App entry point, and a 15-second demo are enough to seed organic growth.

