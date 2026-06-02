/// The vSTRATA vault share token.
///
/// A standard Sui fungible coin whose `TreasuryCap` is handed to a `Vault`
/// at creation, so only the vault can mint/burn shares. Keeping the share
/// token in its own module (with its own one-time witness) lets the generic
/// vault core stay asset/share-agnostic and reusable.
module strata::vstrata;

use sui::coin;

/// One-time witness for the share currency.
public struct VSTRATA has drop {}

fun init(witness: VSTRATA, ctx: &mut TxContext) {
    let (treasury, metadata) = coin::create_currency(
        witness,
        9,
        b"vSTRATA",
        b"Strata Vault Share",
        b"Tokenized ERC-4626 vault share token for the Strata protocol",
        option::none(),
        ctx,
    );
    // Metadata is immutable once published.
    transfer::public_freeze_object(metadata);
    // TreasuryCap goes to the deployer, who passes it into `vault::new`.
    transfer::public_transfer(treasury, ctx.sender());
}
