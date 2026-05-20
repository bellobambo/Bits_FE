# Bits

Bits is an AI-assisted RWA application on Mantle that brings student hostel assets on-chain for verification, rental funding, and transparent rent receipts.
Bits helps landlords list AI-verified hostel assets, investors review AI-verified hostel rental opportunities, and students rent safely with transparent Mantle on-chain receipts.


## AI Role

AI supports the asset onboarding and decision process:

- Landlord verification: reviews proof details and hostel photos to produce a verification status, confidence score, summary, evidence hash, and evidence URI.
- Investor review: analyzes hostel data, funding range, rent terms, and risk signals before an investor funds an opportunity.
- Student review: checks school fit, rent option, room availability, and listing suitability before a student rents.

The AI output is not treated as legal ownership certification. It is used as an assistive review layer that improves transparency and reduces manual review friction.

## Mantle Integration

Bits is deployed for Mantle Sepolia and uses MNT for investment and rent payment flows. The Mantle smart contract manages:

- user registration and role assignment
- hostel asset listing
- AI verification review storage
- investor funding
- student rent payment
- rent receipt creation
- payout and receipt history

AI review metadata is stored on-chain through compact verification records, making the review status, confidence, summary, evidence hash, and transaction history inspectable through Mantle Explorer.

Contract:

- Mantle Sepolia contract: [0xcDFb1272Fad230337C553e8c5649d5C5cf361f03](https://sepolia.mantlescan.xyz/address/0xcdfb1272fad230337c553e8c5649d5c5cf361f03)
- Smart contract repository: [bellobambo/Bits_Mantle_SmartContract](https://github.com/bellobambo/Bits_Mantle_SmartContract)

## User Flows

### Landlords

Landlords register, upload hostel details, submit verification material, run AI review, and list the hostel asset after verification passes. The on-chain record links the asset to its landlord, metadata, pricing, room availability, and AI verification result.

### Investors

Investors browse hostel assets, inspect verification status, run AI-assisted investment review, and fund rental opportunities with MNT. Investment limits are derived from the hostel asset value and remaining funding requirement.

### Students

Students register with school details, browse available hostels, run an AI-assisted fit review, rent a room with MNT, and receive a transparent on-chain rental receipt.

## Rent Split

Funds are split as 10% to the platform, 10% base rent to the landlord, and up to 80% to investors based only on the percentage of the property they have funded. Any unfunded investor share automatically goes back to the landlord.

## Compliance Awareness

Bits keeps AI verification as an assistive review layer rather than a legal guarantee. Verification summaries, confidence scores, evidence hashes, wallet addresses, and transaction records are made transparent on-chain so users can inspect the basis of each listing and payment activity.

## Technical Summary

The frontend reads contract state and writes transactions for registration, listing, AI review storage, investment, rent payment, and receipt history. The smart contract coordinates the RWA lifecycle from hostel onboarding through funding, rental payment, payout recording, and on-chain receipt generation.
