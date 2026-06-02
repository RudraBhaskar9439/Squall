import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { consoleLogger } from "./core/logger.ts";
import { SuiChainClient } from "./adapters/suiChainClient.ts";
import { VolIndexUpdater } from "./services/volIndexUpdater.ts";

const POLL_MS = Number(process.env.POLL_MS ?? 60_000);

async function main(): Promise<void> {
  const secret = process.env.KEEPER_SECRET_KEY;
  if (!secret) throw new Error("KEEPER_SECRET_KEY not set");

  const client = new SuiClient({ url: getFullnodeUrl("testnet") });
  const signer = Ed25519Keypair.fromSecretKey(secret);
  const chain = new SuiChainClient(client, signer);
  const volIndex = new VolIndexUpdater(chain, consoleLogger);

  consoleLogger.info("keeper started", { pollMs: POLL_MS });

  // Simple poll loop. Production: Scheduler with backoff + StateStore-backed
  // roll state machine (see core/stateStore.ts) and a HealthMonitor kill-switch.
  for (;;) {
    try {
      await volIndex.tick();
    } catch (e) {
      consoleLogger.error("tick failed", { e: String(e) });
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main().catch((e) => {
  consoleLogger.error("fatal", { e: String(e) });
  process.exit(1);
});
