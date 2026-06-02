#[test_only]
module strata::integration_tests;

use sui::coin::{Self, Coin};
use sui::test_scenario as ts;
use sui::test_utils;
use strata::mock_strategy;
use strata::vault;

public struct ASSET has drop {}
public struct SHARE has drop {}

const USER: address = @0xA;
const FEE: address = @0xFEE;
const OFFSET: u64 = 1000;

// Full cycle: deposit -> deploy -> harvest profit -> performance fee minted to
// the fee recipient, and the depositor still nets a (smaller) gain.
#[test]
fun deposit_harvest_fee_cycle() {
    let mut sc = ts::begin(USER);
    {
        let ctx = ts::ctx(&mut sc);
        let treasury = coin::create_treasury_cap_for_testing<SHARE>(ctx);
        let (mut v, admin, strat) = vault::new<ASSET, SHARE>(treasury, 0, OFFSET, ctx);

        // 20% performance fee, no management fee, fees go to FEE.
        vault::set_fees(&mut v, &admin, 0, 2000, FEE);

        // User deposits 1,000,000.
        let shares = vault::deposit(&mut v, coin::mint_for_testing<ASSET>(1_000_000, ctx), ctx);

        // First harvest with no profit -> seeds the high-water mark, no fee.
        mock_strategy::harvest_with_profit(&mut v, &strat, 500_000, 0, 1_000, ctx);
        assert!(vault::total_shares(&v) == 1_000_000_000, 0);

        // Second harvest earns 100,000 profit -> performance fee charged.
        mock_strategy::harvest_with_profit(&mut v, &strat, 1_000_000, 100_000, 2_000, ctx);

        assert!(vault::total_assets(&v) == 1_100_000, 1);
        assert!(vault::total_shares(&v) > 1_000_000_000, 2); // fee shares minted

        // Depositor: still in profit, but the fee took a cut of the upside.
        let uval = vault::convert_to_assets(&v, coin::value(&shares));
        assert!(uval > 1_000_000, 3);
        assert!(uval < 1_100_000, 4);

        coin::burn_for_testing(shares);
        test_utils::destroy(v);
        test_utils::destroy(admin);
        test_utils::destroy(strat);
    };

    // The fee recipient actually received share coins.
    ts::next_tx(&mut sc, FEE);
    {
        let fee_coin = ts::take_from_address<Coin<SHARE>>(&sc, FEE);
        assert!(coin::value(&fee_coin) > 0, 5);
        coin::burn_for_testing(fee_coin);
    };
    ts::end(sc);
}
