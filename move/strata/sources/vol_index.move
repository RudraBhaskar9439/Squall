/// On-chain volatility index — the first on Sui.
///
/// The heavy SVI math (deriving ATM implied vol from the Predict `OracleSVI`
/// parameters) runs off-chain in the keeper, which pushes the result here via
/// an `IndexPublisherCap`. On-chain we store the latest value, an EMA-smoothed
/// value, and emit an event so any Sui protocol can read or subscribe to a
/// canonical vol benchmark.
module strata::vol_index;

use sui::event;

const ENotPublisher: u64 = 0;
const EBadAlpha: u64 = 1;

const BPS: u128 = 1000; // alpha is expressed in thousandths

/// Authority to publish updates to one specific index.
public struct IndexPublisherCap has key, store { id: UID, index_id: ID }

public struct VolIndex has key {
    id: UID,
    value: u64, // annualized ATM IV, scaled 1e6 (650000 = 65%)
    ema: u64, // EMA-smoothed value, same scale
    alpha: u64, // EMA factor in thousandths (200 = 0.2)
    last_update_ms: u64,
    updates: u64,
}

public struct IndexUpdated has copy, drop { index: ID, value: u64, ema: u64, ts_ms: u64 }

// =========================== lifecycle ===========================

public fun new(alpha: u64, ctx: &mut TxContext): (VolIndex, IndexPublisherCap) {
    assert!(alpha > 0 && (alpha as u128) <= BPS, EBadAlpha);
    let id = object::new(ctx);
    let index_id = object::uid_to_inner(&id);
    let idx = VolIndex { id, value: 0, ema: 0, alpha, last_update_ms: 0, updates: 0 };
    (idx, IndexPublisherCap { id: object::new(ctx), index_id })
}

#[allow(lint(self_transfer))]
public fun create_and_share(alpha: u64, ctx: &mut TxContext) {
    let (idx, cap) = new(alpha, ctx);
    transfer::share_object(idx);
    transfer::public_transfer(cap, ctx.sender());
}

// =========================== publish ===========================

/// Push a new index value (keeper-only). `ts_ms` is the clock timestamp.
public fun update(idx: &mut VolIndex, cap: &IndexPublisherCap, value: u64, ts_ms: u64) {
    assert!(cap.index_id == object::id(idx), ENotPublisher);
    idx.value = value;
    if (idx.updates == 0) {
        idx.ema = value;
    } else {
        // ema = (value*alpha + ema*(BPS-alpha)) / BPS, computed in u128.
        let a = (idx.alpha as u128);
        let blended = (value as u128) * a + (idx.ema as u128) * (BPS - a);
        idx.ema = (blended / BPS) as u64;
    };
    idx.last_update_ms = ts_ms;
    idx.updates = idx.updates + 1;
    event::emit(IndexUpdated { index: object::id(idx), value, ema: idx.ema, ts_ms });
}

// =========================== views ===========================

public fun value(idx: &VolIndex): u64 { idx.value }
public fun ema(idx: &VolIndex): u64 { idx.ema }
public fun last_update_ms(idx: &VolIndex): u64 { idx.last_update_ms }
public fun updates(idx: &VolIndex): u64 { idx.updates }
