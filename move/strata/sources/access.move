/// Capability objects for authority separation.
///
/// Every privileged action in the protocol is gated by one of these caps,
/// and each cap is bound to a single `vault_id` so a cap for vault A can
/// never be used against vault B.
module strata::access;

/// Authority to administer a specific vault (pause, config).
public struct AdminCap has key, store { id: UID, vault_id: ID }

/// Authority to run keeper operations (rolls, index updates).
public struct KeeperCap has key, store { id: UID, vault_id: ID }

/// Authority for the single strategy bound to a vault to move its funds.
public struct StrategyCap has key, store { id: UID, vault_id: ID }

public(package) fun new_admin(vault_id: ID, ctx: &mut TxContext): AdminCap {
    AdminCap { id: object::new(ctx), vault_id }
}

public(package) fun new_keeper(vault_id: ID, ctx: &mut TxContext): KeeperCap {
    KeeperCap { id: object::new(ctx), vault_id }
}

public(package) fun new_strategy(vault_id: ID, ctx: &mut TxContext): StrategyCap {
    StrategyCap { id: object::new(ctx), vault_id }
}

public fun admin_vault_id(c: &AdminCap): ID { c.vault_id }
public fun keeper_vault_id(c: &KeeperCap): ID { c.vault_id }
public fun strategy_vault_id(c: &StrategyCap): ID { c.vault_id }
