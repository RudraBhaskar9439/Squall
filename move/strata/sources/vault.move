/// Generic, strategy-agnostic ERC-4626 vault core.
///
/// `Vault<A, S>` accepts deposits of asset `A`, issues share token `S`, and
/// exposes the full ERC-4626 surface (deposit / redeem / previews / convert /
/// totalAssets). Funds are deployed to a single capability-bound strategy via
/// `take_for_strategy` and revalued via `report` (the "cached deployed value,
/// refresh on harvest" model — keeps NAV reads O(1) and gas-cheap).
///
/// Inflation-attack protection comes from `math`'s virtual-offset conversion.
module strata::vault;

use sui::balance::{Self, Balance};
use sui::coin::{Self, Coin, TreasuryCap};
use sui::event;
use strata::access::{Self, AdminCap, StrategyCap};
use strata::fees;
use strata::math;

const EPaused: u64 = 0;
const EZeroAmount: u64 = 1;
const EWrongVault: u64 = 2;
const EInsufficientIdle: u64 = 3;
const EDepositCapExceeded: u64 = 4;

public struct VaultConfig has store {
    paused: bool,
    deposit_cap: u64, // 0 = unlimited
    offset_pow: u64, // virtual-share offset, e.g. 1000
    mgmt_bps: u64, // annual management fee in bps
    perf_bps: u64, // performance fee in bps (above HWM)
    fee_recipient: address,
}

public struct Vault<phantom A, phantom S> has key {
    id: UID,
    idle: Balance<A>, // undeployed funds available for withdrawal
    deployed_value: u64, // cached mark of funds held by the strategy
    treasury: TreasuryCap<S>, // mints/burns share token
    config: VaultConfig,
    hwm_pps: u128, // high-water mark price-per-share for perf fees
    last_accrual_ms: u64, // timestamp of last fee accrual
}

public struct Deposited has copy, drop { vault: ID, assets: u64, shares: u64 }
public struct Redeemed has copy, drop { vault: ID, assets: u64, shares: u64 }
public struct Reported has copy, drop { vault: ID, idle: u64, deployed: u64 }

// =========================== lifecycle ===========================

/// Create a new vault. Returns the vault plus its admin and strategy caps.
public fun new<A, S>(
    treasury: TreasuryCap<S>,
    deposit_cap: u64,
    offset_pow: u64,
    ctx: &mut TxContext,
): (Vault<A, S>, AdminCap, StrategyCap) {
    let id = object::new(ctx);
    let vault_id = object::uid_to_inner(&id);
    let vault = Vault<A, S> {
        id,
        idle: balance::zero<A>(),
        deployed_value: 0,
        treasury,
        config: VaultConfig {
            paused: false,
            deposit_cap,
            offset_pow,
            mgmt_bps: 0,
            perf_bps: 0,
            fee_recipient: ctx.sender(),
        },
        hwm_pps: 0,
        last_accrual_ms: 0,
    };
    (vault, access::new_admin(vault_id, ctx), access::new_strategy(vault_id, ctx))
}

/// Convenience: create the vault, share it, and send caps to the sender.
#[allow(lint(self_transfer))]
public fun create_and_share<A, S>(
    treasury: TreasuryCap<S>,
    deposit_cap: u64,
    offset_pow: u64,
    ctx: &mut TxContext,
) {
    let (vault, admin, strat) = new<A, S>(treasury, deposit_cap, offset_pow, ctx);
    transfer::share_object(vault);
    let sender = ctx.sender();
    transfer::public_transfer(admin, sender);
    transfer::public_transfer(strat, sender);
}

// =========================== ERC-4626 views ===========================

public fun total_assets<A, S>(v: &Vault<A, S>): u64 {
    balance::value(&v.idle) + v.deployed_value
}

public fun total_shares<A, S>(v: &Vault<A, S>): u64 {
    coin::total_supply(&v.treasury)
}

public fun idle_balance<A, S>(v: &Vault<A, S>): u64 { balance::value(&v.idle) }

public fun deployed_value<A, S>(v: &Vault<A, S>): u64 { v.deployed_value }

public fun is_paused<A, S>(v: &Vault<A, S>): bool { v.config.paused }

public fun convert_to_shares<A, S>(v: &Vault<A, S>, assets: u64): u64 {
    math::to_shares(assets, total_assets(v), total_shares(v), v.config.offset_pow, false)
}

public fun convert_to_assets<A, S>(v: &Vault<A, S>, shares: u64): u64 {
    math::to_assets(shares, total_assets(v), total_shares(v), v.config.offset_pow, false)
}

public fun preview_deposit<A, S>(v: &Vault<A, S>, assets: u64): u64 {
    convert_to_shares(v, assets)
}

public fun preview_redeem<A, S>(v: &Vault<A, S>, shares: u64): u64 {
    convert_to_assets(v, shares)
}

/// Assets required to mint exactly `shares` (rounds up, favoring the vault).
public fun preview_mint<A, S>(v: &Vault<A, S>, shares: u64): u64 {
    math::to_assets(shares, total_assets(v), total_shares(v), v.config.offset_pow, true)
}

/// Shares required to withdraw exactly `assets` (rounds up, favoring the vault).
public fun preview_withdraw<A, S>(v: &Vault<A, S>, assets: u64): u64 {
    math::to_shares(assets, total_assets(v), total_shares(v), v.config.offset_pow, true)
}

// =========================== user actions ===========================

/// Deposit `input` assets, receive freshly minted share coins.
public fun deposit<A, S>(v: &mut Vault<A, S>, input: Coin<A>, ctx: &mut TxContext): Coin<S> {
    assert!(!v.config.paused, EPaused);
    let assets = coin::value(&input);
    assert!(assets > 0, EZeroAmount);
    if (v.config.deposit_cap > 0) {
        assert!(math::add(total_assets(v), assets) <= v.config.deposit_cap, EDepositCapExceeded);
    };
    let shares = math::to_shares(
        assets,
        total_assets(v),
        total_shares(v),
        v.config.offset_pow,
        false,
    );
    assert!(shares > 0, EZeroAmount);
    balance::join(&mut v.idle, coin::into_balance(input));
    let out = coin::mint(&mut v.treasury, shares, ctx);
    event::emit(Deposited { vault: object::id(v), assets, shares });
    out
}

/// Burn `shares_in` share coins, receive the proportional assets from idle.
/// Requires sufficient idle liquidity (keeper maintains a buffer / queue).
public fun redeem<A, S>(v: &mut Vault<A, S>, shares_in: Coin<S>, ctx: &mut TxContext): Coin<A> {
    assert!(!v.config.paused, EPaused);
    let shares = coin::value(&shares_in);
    assert!(shares > 0, EZeroAmount);
    let assets = math::to_assets(
        shares,
        total_assets(v),
        total_shares(v),
        v.config.offset_pow,
        false,
    );
    assert!(assets <= balance::value(&v.idle), EInsufficientIdle);
    coin::burn(&mut v.treasury, shares_in);
    let out = coin::take(&mut v.idle, assets, ctx);
    event::emit(Redeemed { vault: object::id(v), assets, shares });
    out
}

// =================== strategy hooks (capability-gated) ===================

/// Pull `amount` of idle funds out for the strategy to deploy.
/// Cost basis is added to `deployed_value`; the real mark is set by `report`.
public fun take_for_strategy<A, S>(
    v: &mut Vault<A, S>,
    cap: &StrategyCap,
    amount: u64,
): Balance<A> {
    assert!(access::strategy_vault_id(cap) == object::id(v), EWrongVault);
    assert!(amount <= balance::value(&v.idle), EInsufficientIdle);
    v.deployed_value = math::add(v.deployed_value, amount);
    balance::split(&mut v.idle, amount)
}

/// Strategy returns realized cash to idle and reports the current mark of
/// whatever remains deployed. This is the vault's NAV refresh point, and also
/// where management + performance fees accrue. `now_ms` is the clock time.
public fun report<A, S>(
    v: &mut Vault<A, S>,
    cap: &StrategyCap,
    returned: Balance<A>,
    new_deployed_value: u64,
    now_ms: u64,
    ctx: &mut TxContext,
) {
    assert!(access::strategy_vault_id(cap) == object::id(v), EWrongVault);
    balance::join(&mut v.idle, returned);
    v.deployed_value = new_deployed_value;
    accrue_fees(v, now_ms, ctx);
    event::emit(Reported {
        vault: object::id(v),
        idle: balance::value(&v.idle),
        deployed: new_deployed_value,
    });
}

/// Mint fee shares (dilution) for elapsed management fees and any performance
/// above the high-water mark. Called on every `report`.
fun accrue_fees<A, S>(v: &mut Vault<A, S>, now_ms: u64, ctx: &mut TxContext) {
    let ta = total_assets(v);
    if (total_shares(v) == 0) {
        v.last_accrual_ms = now_ms;
        return
    };

    let elapsed = if (now_ms > v.last_accrual_ms) { now_ms - v.last_accrual_ms } else { 0 };
    let mgmt_shares = fees::management_fee_shares(ta, total_shares(v), v.config.mgmt_bps, elapsed);
    if (mgmt_shares > 0) {
        let c = coin::mint(&mut v.treasury, mgmt_shares, ctx);
        transfer::public_transfer(c, v.config.fee_recipient);
    };

    let (perf_shares, new_hwm) =
        fees::performance_fee_shares(ta, total_shares(v), v.hwm_pps, v.config.perf_bps);
    if (perf_shares > 0) {
        let c = coin::mint(&mut v.treasury, perf_shares, ctx);
        transfer::public_transfer(c, v.config.fee_recipient);
    };

    v.hwm_pps = new_hwm;
    v.last_accrual_ms = now_ms;
}

// =========================== admin ===========================

public fun set_paused<A, S>(v: &mut Vault<A, S>, cap: &AdminCap, paused: bool) {
    assert!(access::admin_vault_id(cap) == object::id(v), EWrongVault);
    v.config.paused = paused;
}

public fun set_fees<A, S>(
    v: &mut Vault<A, S>,
    cap: &AdminCap,
    mgmt_bps: u64,
    perf_bps: u64,
    fee_recipient: address,
) {
    assert!(access::admin_vault_id(cap) == object::id(v), EWrongVault);
    v.config.mgmt_bps = mgmt_bps;
    v.config.perf_bps = perf_bps;
    v.config.fee_recipient = fee_recipient;
}
