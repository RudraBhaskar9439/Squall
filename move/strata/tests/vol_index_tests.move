#[test_only]
module strata::vol_index_tests;

use sui::test_scenario as ts;
use sui::test_utils;
use strata::vol_index;

const USER: address = @0xA;

#[test]
fun first_update_seeds_ema_then_smooths() {
    let mut sc = ts::begin(USER);
    let ctx = ts::ctx(&mut sc);

    // alpha = 0.2 (200/1000)
    let (mut idx, cap) = vol_index::new(200, ctx);

    // First update seeds both value and ema.
    vol_index::update(&mut idx, &cap, 500_000, 1);
    assert!(vol_index::value(&idx) == 500_000, 0);
    assert!(vol_index::ema(&idx) == 500_000, 1);

    // Second update: ema = 800k*0.2 + 500k*0.8 = 560k.
    vol_index::update(&mut idx, &cap, 800_000, 2);
    assert!(vol_index::value(&idx) == 800_000, 2);
    assert!(vol_index::ema(&idx) == 560_000, 3);
    assert!(vol_index::updates(&idx) == 2, 4);

    test_utils::destroy(idx);
    test_utils::destroy(cap);
    ts::end(sc);
}

#[test, expected_failure]
fun update_requires_matching_cap() {
    let mut sc = ts::begin(USER);
    let ctx = ts::ctx(&mut sc);

    let (idx1, cap1) = vol_index::new(200, ctx);
    let (mut idx2, cap2) = vol_index::new(200, ctx);

    vol_index::update(&mut idx2, &cap1, 1, 1); // wrong cap -> abort

    test_utils::destroy(idx1);
    test_utils::destroy(idx2);
    test_utils::destroy(cap1);
    test_utils::destroy(cap2);
    ts::end(sc);
}
