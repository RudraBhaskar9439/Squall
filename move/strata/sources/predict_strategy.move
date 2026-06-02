/// DeepBook Predict strategy: the premium-harvest leg of Strata.
///
/// Holds the vault's `StrategyCap` and its PLP position. Capital pulled from the
/// vault is supplied into Predict's PLP vault (`predict::supply`) to earn the
/// option-seller spread; divesting redeems PLP back to the quote asset
/// (`predict::withdraw`) and returns it to the vault. NAV is refreshed via
/// `harvest`, where the keeper supplies the off-chain-computed mark of the
/// deployed PLP (your_plp * vault_value / total_plp_supply).
///
/// Generic over `Quote` (the vault asset, e.g. DUSDC) and `Share` (vSTRATA), so
/// the same strategy works for any Predict quote asset.
module strata::predict_strategy;

use deepbook_predict::plp::PLP;
use deepbook_predict::predict::{Self, Predict};
use strata::access::StrategyCap;
use strata::vault::{Self, Vault};
use sui::balance::{Self, Balance};
use sui::clock::Clock;
use sui::coin;

public struct PredictStrategy<phantom Quote, phantom Share> has key {
    id: UID,
    cap: StrategyCap, // authority to move this vault's funds
    plp: Balance<PLP>, // current deployed PLP position
}

/// Bind a strategy to a vault by consuming its `StrategyCap`, then share it.
public fun new<Quote, Share>(cap: StrategyCap, ctx: &mut TxContext) {
    let strat = PredictStrategy<Quote, Share> {
        id: object::new(ctx),
        cap,
        plp: balance::zero<PLP>(),
    };
    transfer::share_object(strat);
}

/// Pull `amount` of idle quote from the vault and supply it into Predict's PLP.
public fun allocate<Quote, Share>(
    strat: &mut PredictStrategy<Quote, Share>,
    vault: &mut Vault<Quote, Share>,
    predict: &mut Predict,
    amount: u64,
    clock: &Clock,
    ctx: &mut TxContext,
) {
    let funds = vault::take_for_strategy(vault, &strat.cap, amount);
    let plp_coin = predict::supply<Quote>(predict, coin::from_balance(funds, ctx), clock, ctx);
    strat.plp.join(plp_coin.into_balance());
}

/// Redeem `plp_amount` of PLP back to quote, return it to the vault, and mark
/// the remaining deployed value (`new_deployed_value`, computed by the keeper).
public fun divest<Quote, Share>(
    strat: &mut PredictStrategy<Quote, Share>,
    vault: &mut Vault<Quote, Share>,
    predict: &mut Predict,
    plp_amount: u64,
    new_deployed_value: u64,
    clock: &Clock,
    now_ms: u64,
    ctx: &mut TxContext,
) {
    let plp_coin = coin::from_balance(strat.plp.split(plp_amount), ctx);
    let quote = predict::withdraw<Quote>(predict, plp_coin, clock, ctx);
    vault::report(vault, &strat.cap, quote.into_balance(), new_deployed_value, now_ms, ctx);
}

/// Refresh NAV without moving funds: keeper supplies the current PLP mark.
public fun harvest<Quote, Share>(
    strat: &PredictStrategy<Quote, Share>,
    vault: &mut Vault<Quote, Share>,
    new_deployed_value: u64,
    now_ms: u64,
    ctx: &mut TxContext,
) {
    vault::report(vault, &strat.cap, balance::zero<Quote>(), new_deployed_value, now_ms, ctx);
}

public fun plp_balance<Quote, Share>(strat: &PredictStrategy<Quote, Share>): u64 {
    strat.plp.value()
}
