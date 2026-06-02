#[test_only]
module strata::fees_tests;

use strata::fees;

const YEAR_MS: u64 = 31_536_000_000;

#[test]
fun management_fee_one_year() {
    // 2% of 1,000,000 AUM over a full year = 20,000 assets, minted as dilution.
    // shares = 20000 * 1e9 / (1e6 - 20000) = 20_408_163
    let s = fees::management_fee_shares(1_000_000, 1_000_000_000, 200, YEAR_MS);
    assert!(s == 20_408_163, 0);
}

#[test]
fun management_fee_zero_when_no_time() {
    assert!(fees::management_fee_shares(1_000_000, 1_000_000_000, 200, 0) == 0, 0);
}

#[test]
fun performance_fee_seeds_then_charges() {
    // Seed HWM at price = 1.0 pps for 1e6 assets / 1e9 shares.
    let (s0, hwm0) = fees::performance_fee_shares(1_000_000, 1_000_000_000, 0, 2000);
    assert!(s0 == 0, 0); // first call seeds, no fee
    assert!(hwm0 == 1_000_000_000, 1); // 1e6 * 1e12 / 1e9

    // Now assets grew to 1.1e6 (100k profit). 20% perf fee on 100k = 20k assets.
    // shares = 20000 * 1e9 / (1.1e6 - 20000) = 18_518_518
    let (s1, hwm1) = fees::performance_fee_shares(1_100_000, 1_000_000_000, hwm0, 2000);
    assert!(s1 == 18_518_518, 2);
    assert!(hwm1 == 1_100_000_000, 3);
}

#[test]
fun performance_fee_zero_below_hwm() {
    // price below the mark -> no fee, HWM unchanged
    let (s, hwm) = fees::performance_fee_shares(900_000, 1_000_000_000, 1_000_000_000, 2000);
    assert!(s == 0, 0);
    assert!(hwm == 1_000_000_000, 1);
}
