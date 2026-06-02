/// Reusable fixed-point + ERC-4626 conversion math.
///
/// Pure functions, no storage, no dependencies — usable by any vault or
/// strategy in the package (and safe to copy into other projects).
module strata::math;

const EZeroDivision: u64 = 0;
const EOverflow: u64 = 1;

const U64_MAX: u128 = 18446744073709551615;

/// Full-precision `(a * b) / c` with explicit rounding direction.
/// Intermediate math is done in u128 to avoid overflow.
public fun mul_div(a: u64, b: u64, c: u64, round_up: bool): u64 {
    assert!(c != 0, EZeroDivision);
    let product = (a as u128) * (b as u128);
    let cc = (c as u128);
    let mut result = product / cc;
    if (round_up && (product % cc) != 0) {
        result = result + 1;
    };
    assert!(result <= U64_MAX, EOverflow);
    (result as u64)
}

/// ERC-4626 assets -> shares, with virtual-offset inflation protection.
///   shares = assets * (totalSupply + offsetPow) / (totalAssets + 1)
/// The `offsetPow` virtual shares + 1 virtual asset make the classic
/// first-depositor / donation inflation attack economically infeasible.
public fun to_shares(
    assets: u64,
    total_assets: u64,
    total_supply: u64,
    offset_pow: u64,
    round_up: bool,
): u64 {
    mul_div(assets, add(total_supply, offset_pow), add(total_assets, 1), round_up)
}

/// ERC-4626 shares -> assets.
///   assets = shares * (totalAssets + 1) / (totalSupply + offsetPow)
public fun to_assets(
    shares: u64,
    total_assets: u64,
    total_supply: u64,
    offset_pow: u64,
    round_up: bool,
): u64 {
    mul_div(shares, add(total_assets, 1), add(total_supply, offset_pow), round_up)
}

/// Checked u64 addition.
public fun add(a: u64, b: u64): u64 {
    let s = (a as u128) + (b as u128);
    assert!(s <= U64_MAX, EOverflow);
    (s as u64)
}
