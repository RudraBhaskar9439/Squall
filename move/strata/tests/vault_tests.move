#[test_only]
module strata::vault_tests;

use sui::balance;
use sui::coin;
use sui::test_scenario as ts;
use sui::test_utils;
use strata::vault;

public struct ASSET has drop {}
public struct SHARE has drop {}

const USER: address = @0xA;
const OFFSET: u64 = 1000; // virtual-share inflation guard

// Deposit then redeem all shares returns the original assets (no fee path).
#[test]
fun deposit_redeem_roundtrip() {
    let mut sc = ts::begin(USER);
    let ctx = ts::ctx(&mut sc);

    let treasury = coin::create_treasury_cap_for_testing<SHARE>(ctx);
    let (mut v, admin, strat) = vault::new<ASSET, SHARE>(treasury, 0, OFFSET, ctx);

    let input = coin::mint_for_testing<ASSET>(1_000_000, ctx);
    let shares = vault::deposit(&mut v, input, ctx);
    assert!(coin::value(&shares) == 1_000_000_000, 0); // 1e6 * offset
    assert!(vault::total_assets(&v) == 1_000_000, 1);

    let out = vault::redeem(&mut v, shares, ctx);
    assert!(coin::value(&out) == 1_000_000, 2);
    assert!(vault::total_shares(&v) == 0, 3);

    coin::burn_for_testing(out);
    test_utils::destroy(v);
    test_utils::destroy(admin);
    test_utils::destroy(strat);
    ts::end(sc);
}

// Strategy profit raises the share price: existing shares become worth more.
#[test]
fun profit_raises_share_price() {
    let mut sc = ts::begin(USER);
    let ctx = ts::ctx(&mut sc);

    let treasury = coin::create_treasury_cap_for_testing<SHARE>(ctx);
    let (mut v, admin, strat) = vault::new<ASSET, SHARE>(treasury, 0, OFFSET, ctx);

    let shares = vault::deposit(&mut v, coin::mint_for_testing<ASSET>(1_000_000, ctx), ctx);

    // Deploy 500k to the strategy, then report it came back as 600k (100k profit).
    let deployed = vault::take_for_strategy(&mut v, &strat, 500_000);
    balance::destroy_for_testing(deployed); // simulate the strategy consuming it
    vault::report(&mut v, &strat, balance::create_for_testing<ASSET>(600_000), 0, 1000, ctx);

    assert!(vault::total_assets(&v) == 1_100_000, 0); // 500k idle left + 600k returned
    // The same shares now redeem for more than the original deposit.
    assert!(vault::convert_to_assets(&v, coin::value(&shares)) > 1_000_000, 1);

    coin::burn_for_testing(shares);
    test_utils::destroy(v);
    test_utils::destroy(admin);
    test_utils::destroy(strat);
    ts::end(sc);
}

// Deposits revert while the vault is paused.
#[test, expected_failure]
fun deposit_reverts_when_paused() {
    let mut sc = ts::begin(USER);
    let ctx = ts::ctx(&mut sc);

    let treasury = coin::create_treasury_cap_for_testing<SHARE>(ctx);
    let (mut v, admin, strat) = vault::new<ASSET, SHARE>(treasury, 0, OFFSET, ctx);

    vault::set_paused(&mut v, &admin, true);
    let shares = vault::deposit(&mut v, coin::mint_for_testing<ASSET>(1, ctx), ctx); // aborts

    coin::burn_for_testing(shares);
    test_utils::destroy(v);
    test_utils::destroy(admin);
    test_utils::destroy(strat);
    ts::end(sc);
}

// A strategy cap from one vault cannot move another vault's funds.
#[test, expected_failure]
fun strategy_cap_bound_to_vault() {
    let mut sc = ts::begin(USER);
    let ctx = ts::ctx(&mut sc);

    let t1 = coin::create_treasury_cap_for_testing<SHARE>(ctx);
    let t2 = coin::create_treasury_cap_for_testing<SHARE>(ctx);
    let (v1, admin1, strat1) = vault::new<ASSET, SHARE>(t1, 0, OFFSET, ctx);
    let (mut v2, admin2, strat2) = vault::new<ASSET, SHARE>(t2, 0, OFFSET, ctx);

    // Using vault 1's cap on vault 2 must abort.
    let stolen = vault::take_for_strategy(&mut v2, &strat1, 0);
    balance::destroy_for_testing(stolen);

    test_utils::destroy(v1);
    test_utils::destroy(v2);
    test_utils::destroy(admin1);
    test_utils::destroy(admin2);
    test_utils::destroy(strat1);
    test_utils::destroy(strat2);
    ts::end(sc);
}
