/// Squall proof log — an on-chain, append-only anchor for Walrus snapshots.
///
/// Each entry commits {epoch, NAV, totalShares, blobId, prevBlob} on-chain, so
/// the Walrus track record becomes both:
///   - *complete*  — the on-chain log is the index, so epochs can't be hidden,
///                   dropped, or reordered off-chain; and
///   - *trustless* — the committed NAV is anchored on Sui (not in a file the
///                   team controls), and each entry's prevBlob hash-chains it
///                   to the one before.
///
/// Writes are gated by a `ProofWriterCap` (held by the keeper/admin). Anyone can
/// read the log and re-fetch each blob from Walrus to verify it matches.
module proof::proof;

use std::string::String;
use sui::event;

const ECapMismatch: u64 = 0;

/// One anchored snapshot commitment.
public struct Anchor has store, copy, drop {
    epoch: u64,
    ts_ms: u64,
    nav_assets: u64,
    total_shares: u64,
    blob_id: String,
    prev_blob: String,
}

/// Shared, append-only log of anchors.
public struct ProofLog has key {
    id: UID,
    entries: vector<Anchor>,
    count: u64,
}

/// Authority to append to a specific `ProofLog`.
public struct ProofWriterCap has key, store {
    id: UID,
    log_id: ID,
}

/// Emitted on every anchor so clients can reconstruct the history from events.
public struct Anchored has copy, drop {
    log_id: ID,
    index: u64,
    epoch: u64,
    nav_assets: u64,
    blob_id: String,
    prev_blob: String,
}

/// Create a log and its writer cap.
public fun new(ctx: &mut TxContext): (ProofLog, ProofWriterCap) {
    let log = ProofLog { id: object::new(ctx), entries: vector[], count: 0 };
    let cap = ProofWriterCap { id: object::new(ctx), log_id: object::id(&log) };
    (log, cap)
}

/// Create the log, share it, and transfer the writer cap to the sender.
entry fun create_and_share(ctx: &mut TxContext) {
    let (log, cap) = new(ctx);
    transfer::share_object(log);
    transfer::public_transfer(cap, ctx.sender());
}

/// Append a snapshot commitment. Gated by the writer cap bound to this log.
entry fun anchor(
    log: &mut ProofLog,
    cap: &ProofWriterCap,
    epoch: u64,
    ts_ms: u64,
    nav_assets: u64,
    total_shares: u64,
    blob_id: String,
    prev_blob: String,
) {
    assert!(cap.log_id == object::id(log), ECapMismatch);
    log.entries.push_back(Anchor { epoch, ts_ms, nav_assets, total_shares, blob_id, prev_blob });
    let index = log.count;
    log.count = log.count + 1;
    event::emit(Anchored { log_id: object::id(log), index, epoch, nav_assets, blob_id, prev_blob });
}

/// Number of anchors recorded.
public fun count(log: &ProofLog): u64 {
    log.count
}
