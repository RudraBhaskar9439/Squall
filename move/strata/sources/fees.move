/// Reusable fee math: management (AUM-over-time) and performance (above a
/// high-water mark). Both are pure functions returning the number of *share*
/// coins to mint to the fee recipient — i.e. fees are charged as dilution,
/// which is gas-cheap and keeps assets fully invested.
module strata::fees;

const BPS: u128 = 10000;
const YEAR_MS: u128 = 31_536_000_000; // 365 days
const SCALE: u128 = 1_000_000_000_000; // 1e12 price-per-share scale

/// Price per share, scaled by SCALE. Zero when there are no shares.
public fun price_per_share(total_assets: u64, total_shares: u64): u128 {
    if (total_shares == 0) {
        0
    } else {
        ((total_assets as u128) * SCALE) / (total_shares as u128)
    }
}

/// Management fee shares: `total_assets * mgmt_bps * elapsed / year`, as dilution.
public fun management_fee_shares(
    total_assets: u64,
    total_shares: u64,
    mgmt_bps: u64,
    elapsed_ms: u64,
): u64 {
    if (mgmt_bps == 0 || elapsed_ms == 0 || total_shares == 0 || total_assets == 0) {
        return 0
    };
    let fee_assets =
        ((total_assets as u128) * (mgmt_bps as u128) * (elapsed_ms as u128)) / (BPS * YEAR_MS);
    shares_for_assets(fee_assets, total_assets, total_shares)
}

/// Performance fee shares for profit above the high-water mark, plus the new
/// HWM to store. Returns `(0, pps)` to *initialize* the HWM the first time
/// (`hwm_pps == 0`), and `(0, hwm)` when price is at/below the mark.
public fun performance_fee_shares(
    total_assets: u64,
    total_shares: u64,
    hwm_pps: u128,
    perf_bps: u64,
): (u64, u128) {
    if (total_shares == 0) { return (0, hwm_pps) };
    let pps = price_per_share(total_assets, total_shares);
    if (hwm_pps == 0) { return (0, pps) }; // first accrual: seed the HWM
    if (pps <= hwm_pps) { return (0, hwm_pps) }; // no new high
    if (perf_bps == 0) { return (0, pps) };

    // total profit (in assets) above the mark across all shares
    let profit = ((pps - hwm_pps) * (total_shares as u128)) / SCALE;
    let fee_assets = (profit * (perf_bps as u128)) / BPS;
    (shares_for_assets(fee_assets, total_assets, total_shares), pps)
}

/// Shares whose post-mint value equals `fee_assets`:
///   fee_shares = fee_assets * total_shares / (total_assets - fee_assets)
fun shares_for_assets(fee_assets: u128, total_assets: u64, total_shares: u64): u64 {
    if (fee_assets == 0) { return 0 };
    let ta = (total_assets as u128);
    if (fee_assets >= ta) { return 0 }; // sanity guard
    let fee_shares = (fee_assets * (total_shares as u128)) / (ta - fee_assets);
    (fee_shares as u64)
}
