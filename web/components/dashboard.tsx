"use client";

import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import { useState } from "react";
import { STRATA, TYPES, DECIMALS, OFFSET_POW } from "@/lib/strata";

// Extract a u64 from a possibly-nested object content field.
function pu64(f: unknown): number {
  if (f == null) return 0;
  if (typeof f === "string" || typeof f === "number") return Number(f);
  const o = f as { value?: unknown; fields?: { value?: unknown } };
  if (o.fields?.value != null) return Number(o.fields.value);
  if (o.value != null) return Number(o.value);
  return 0;
}

const fmt = (base: number, dec: number, max = 4) =>
  (base / 10 ** dec).toLocaleString(undefined, { maximumFractionDigits: max });

export function VaultDashboard() {
  const account = useCurrentAccount();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const [deposit, setDeposit] = useState("");
  const [withdraw, setWithdraw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const vaultQ = useSuiClientQuery("getObject", {
    id: STRATA.vault,
    options: { showContent: true },
  });
  const dusdcQ = useSuiClientQuery(
    "getBalance",
    { owner: account?.address ?? "", coinType: TYPES.dusdc },
    { enabled: !!account },
  );
  const vstrataQ = useSuiClientQuery(
    "getBalance",
    { owner: account?.address ?? "", coinType: TYPES.vstrata },
    { enabled: !!account },
  );

  const refetchAll = () => {
    vaultQ.refetch();
    dusdcQ.refetch();
    vstrataQ.refetch();
  };

  const content = vaultQ.data?.data?.content;
  const fields = (content && "fields" in content ? content.fields : null) as Record<string, unknown> | null;
  const idle = fields ? pu64(fields.idle) : 0;
  const deployed = fields ? pu64(fields.deployed_value) : 0;
  const totalAssets = idle + deployed;
  const treasury = fields?.treasury as { fields?: { total_supply?: unknown } } | undefined;
  const totalShares = pu64(treasury?.fields?.total_supply);
  const userVstrata = vstrataQ.data ? Number(vstrataQ.data.totalBalance) : 0;
  const userDusdc = dusdcQ.data ? Number(dusdcQ.data.totalBalance) : 0;
  const positionValue =
    totalShares > 0
      ? Math.floor((userVstrata * (totalAssets + 1)) / (totalShares + OFFSET_POW))
      : 0;

  function runDeposit() {
    const base = Math.floor(parseFloat(deposit) * 10 ** DECIMALS.dusdc);
    if (!account || !base || base <= 0) return;
    const tx = new Transaction();
    const shares = tx.moveCall({
      target: `${STRATA.package}::vault::deposit`,
      typeArguments: [TYPES.dusdc, TYPES.vstrata],
      arguments: [tx.object(STRATA.vault), coinWithBalance({ type: TYPES.dusdc, balance: BigInt(base) })],
    });
    tx.transferObjects([shares], account.address);
    setMsg("Depositing…");
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (r) => {
          setMsg(`Deposited ✓ ${r.digest.slice(0, 10)}…`);
          setDeposit("");
          setTimeout(refetchAll, 1500);
        },
        onError: (e) => setMsg(`Error: ${e.message}`),
      },
    );
  }

  function runWithdraw() {
    const base = Math.floor(parseFloat(withdraw) * 10 ** DECIMALS.vstrata);
    if (!account || !base || base <= 0) return;
    const tx = new Transaction();
    const out = tx.moveCall({
      target: `${STRATA.package}::vault::redeem`,
      typeArguments: [TYPES.dusdc, TYPES.vstrata],
      arguments: [tx.object(STRATA.vault), coinWithBalance({ type: TYPES.vstrata, balance: BigInt(base) })],
    });
    tx.transferObjects([out], account.address);
    setMsg("Withdrawing…");
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (r) => {
          setMsg(`Withdrew ✓ ${r.digest.slice(0, 10)}…`);
          setWithdraw("");
          setTimeout(refetchAll, 1500);
        },
        onError: (e) => setMsg(`Error: ${e.message}`),
      },
    );
  }

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-white/50">DUSDC Premium-Harvest Vault</div>
          <div className="mt-1 text-2xl font-semibold">vSTRATA</div>
        </div>
        <ConnectButton />
      </div>

      {/* live stats */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat label="TVL" value={`${fmt(totalAssets, DECIMALS.dusdc)} DUSDC`} />
        <Stat label="Deployed (PLP)" value={`${fmt(deployed, DECIMALS.dusdc)} DUSDC`} />
        <Stat label="Your position" value={`${fmt(positionValue, DECIMALS.dusdc)} DUSDC`} />
        <Stat label="Your vSTRATA" value={fmt(userVstrata, DECIMALS.vstrata)} />
      </div>

      {!account ? (
        <p className="mt-6 text-sm text-white/50">Connect a testnet wallet to deposit.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {/* deposit */}
          <Field
            label={`Deposit DUSDC  ·  bal ${fmt(userDusdc, DECIMALS.dusdc)}`}
            value={deposit}
            onChange={setDeposit}
            onMax={() => setDeposit(String(userDusdc / 10 ** DECIMALS.dusdc))}
            action="Deposit"
            onAction={runDeposit}
            disabled={isPending}
          />
          {/* withdraw */}
          <Field
            label={`Withdraw vSTRATA  ·  bal ${fmt(userVstrata, DECIMALS.vstrata)}`}
            value={withdraw}
            onChange={setWithdraw}
            onMax={() => setWithdraw(String(userVstrata / 10 ** DECIMALS.vstrata))}
            action="Withdraw"
            onAction={runWithdraw}
            disabled={isPending}
          />
        </div>
      )}

      {msg && <p className="mt-4 break-words text-xs text-white/60">{msg}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="text-xs text-white/40">{label}</div>
      <div className="mt-1 font-mono text-sm">{value}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onMax,
  action,
  onAction,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onMax: () => void;
  action: string;
  onAction: () => void;
  disabled: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-xs text-white/40">{label}</div>
      <div className="flex gap-2">
        <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-white/[0.02] px-3">
          <input
            inputMode="decimal"
            placeholder="0.0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent py-2.5 text-sm outline-none"
          />
          <button onClick={onMax} className="text-xs text-sui hover:text-aqua">
            MAX
          </button>
        </div>
        <button
          onClick={onAction}
          disabled={disabled}
          className="rounded-xl bg-sui px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-aqua disabled:opacity-50"
        >
          {action}
        </button>
      </div>
    </div>
  );
}
