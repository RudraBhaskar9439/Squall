# On-chain proof anchoring (Tier 1)

Anchors every Walrus snapshot **on Sui**, so the track record is *complete*
(the on-chain log is the index — epochs can't be hidden or reordered) and
*trustless* (the committed NAV lives on-chain, not in a file). Each entry is
hash-chained via `prevBlob`.

The feature is **off by default** — until you deploy and set the env below, the
app behaves exactly as before. Nothing here touches the existing vault package.

## 1. Deploy the `proof` package

```bash
cd move/proof
sui client publish --gas-budget 100000000
# note the published packageId
```

Create the shared log + writer cap:

```bash
sui client call --package <PROOF_PKG> --module proof \
  --function create_and_share --gas-budget 20000000
```

From the call output, record:
- **ProofLog** — the new **shared** object id
- **ProofWriterCap** — the **owned** object id (sent to your active address)

> The address that runs this owns the writer cap. The keeper must sign with that
> same key (or transfer the cap to the keeper's address).

## 2. Set env

**`keeper/.env`**
```
KEEPER_SECRET_KEY=<key that owns the ProofWriterCap>
PROOF_PACKAGE=<PROOF_PKG>
PROOF_LOG=<ProofLog id>
PROOF_WRITER_CAP=<ProofWriterCap id>
```

**`web/.env.local`**
```
NEXT_PUBLIC_PROOF_PACKAGE=<PROOF_PKG>
NEXT_PUBLIC_PROOF_LOG=<ProofLog id>
```

## 3. Seed the on-chain log from the committed history

```bash
cd keeper
# run with your TS runner (matches how you run the keeper), e.g.:
npx tsx scripts/anchor.ts
```

This anchors each entry in `web/public/track-record.json` (hash-chained) into
the ProofLog. Per epoch going forward, call `chain.anchorProof(...)` from the
keeper right after it writes the snapshot to Walrus.

## 4. Verify

Open the Proof tab. Anchored entries show an **⛓ on-chain** badge, and **Verify**
now confirms three things at once:
1. the Walrus blob's NAV matches the **on-chain anchor** (not the local file),
2. the blob's `prevBlob` matches the on-chain commitment, and
3. the hash-chain links to the previous entry.

## Notes
- **Live dashboard deposits** write to Walrus and hash-chain, but do **not**
  anchor on-chain (the user's wallet doesn't hold the writer cap). They show
  🔗 chained; they become ⛓ on-chain once the keeper anchors them.
- `move/proof` is standalone — it does not require re-publishing the vault.
