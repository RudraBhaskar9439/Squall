/// Test-only strategy harness that simulates deploying funds and harvesting a
/// PnL. Serves as the template for the real `predict_strategy` module: pull
/// funds with `take_for_strategy`, do work, then `report` the result.
#[test_only]
module strata::mock_strategy;

use sui::balance;
use strata::access::StrategyCap;
use strata::vault::{Self, Vault};

/// Deploy `amount`, simulate earning `profit` (can be 0), and report back to
/// the vault with everything returned to idle (`new_deployed_value = 0`).
public fun harvest_with_profit<A, S>(
    v: &mut Vault<A, S>,
    cap: &StrategyCap,
    amount: u64,
    profit: u64,
    now_ms: u64,
    ctx: &mut TxContext,
) {
    let deployed = vault::take_for_strategy(v, cap, amount);
    balance::destroy_for_testing(deployed); // strategy "uses" the capital
    let returned = balance::create_for_testing<A>(amount + profit);
    vault::report(v, cap, returned, 0, now_ms, ctx);
}
