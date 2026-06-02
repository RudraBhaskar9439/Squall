"use client";

import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import { useEffect, useState } from "react";
import { STRATA, TYPES, DECIMALS, OFFSET_POW, txUrl } from "@/lib/strata";
import { useToast } from "./toast";

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

type Activity = { id: number; action: string; detail: string; digest: string };

export function VaultDashboard() {
  const account = useCurrentAccount();
  const toast = useToast();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const [deposit, setDeposit] = useState("");
  const [withdraw, setWithdraw] = useState("");
  const [activity, setActivity] = useState<Activity[]>([]);

  useEffect(() => {
    const s = localStorage.getItem("strata-activity");
    if (s) setActivity(JSON.parse(s));
  }, []);
  function logActivity(action: string, detail: string, digest: string) {
    setActivity((prev) => {
      const next = [{ id: Date.now(), action, detail, digest }, ...prev].slice(0, 6);
      localStorage.setItem("strata-activity", JSON.stringify(next));
      return next;
    });
  }

  const vaultQ = useSuiClientQuery("getObject", { id: STRATA.vault, options: { showContent: true } });
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
    totalShares > 0 ? Math.floor((userVstrata * (totalAssets + 1)) / (totalShares + OFFSET_POW)) : 0;

  // previews (plain-language "you'll get")
  const depBase = Math.floor((parseFloat(deposit) || 0) * 10 ** DECIMALS.dusdc);
  const previewShares = depBase > 0 ? (depBase * (totalShares + OFFSET_POW)) / (totalAssets + 1) : 0;
  const wdBase = Math.floor((parseFloat(withdraw) || 0) * 10 ** DECIMALS.vstrata);
  const previewAssets = wdBase > 0 && totalShares > 0 ? (wdBase * (totalAssets + 1)) / (totalShares + OFFSET_POW) : 0;

  function send(tx: Transaction, action: string, detail: string, clear: () => void) {
    toast.push({ variant: "info", title: `${action}…`, desc: detail });
    signAndExecute(
      { transaction: tx },
      {
        onSuccess: (r) => {
          toast.push({ variant: "success", title: `${action} confirmed`, desc: detail, href: txUrl(r.digest) });
          logActivity(action, detail, r.digest);
          clear();
          setTimeout(refetchAll, 1500);
        },
        onError: (e) => toast.push({ variant: "error", title: `${action} failed`, desc: e.message }),
      },
    );
  }

  function runDeposit() {
    if (!account || depBase <= 0) return;
    const tx = new Transaction();
    const shares = tx.moveCall({
      target: `${STRATA.package}::vault::deposit`,
      typeArguments: [TYPES.dusdc, TYPES.vstrata],
      arguments: [tx.object(STRATA.vault), coinWithBalance({ type: TYPES.dusdc, balance: BigInt(depBase) })],
    });
    tx.transferObjects([shares], account.address);
    send(tx, "Deposit", `${deposit} DUSDC`, () => setDeposit(""));
  }

  function runWithdraw() {
    if (!account || wdBase <= 0) return;
    const tx = new Transaction();
    const out = tx.moveCall({
      target: `${STRATA.package}::vault::redeem`,
      typeArguments: [TYPES.dusdc, TYPES.vstrata],
      arguments: [tx.object(STRATA.vault), coinWithBalance({ type: TYPES.vstrata, balance: BigInt(wdBase) })],
    });
    tx.transferObjects([out], account.address);
    send(tx, "Withdraw", `${withdraw} vSTRATA`, () => setWithdraw(""));
  }

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-white/50">Premium-Harvest Vault</div>
          <div className="mt-1 text-2xl font-semibold">vSTRATA</div>
          <p className="mt-1 text-xs text-white/45">
            Deposit DUSDC, earn yield from DeepBook Predict, withdraw anytime.
          </p>
        </div>
        <ConnectButton />
      </div>

      {/* live stats in plain language */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <Stat label="Total deposited (TVL)" value={`${fmt(totalAssets, DECIMALS.dusdc)} DUSDC`} />
        <Stat label="Earning in Predict" value={`${fmt(deployed, DECIMALS.dusdc)} DUSDC`} />
        <Stat label="Your balance" value={`${fmt(positionValue, DECIMALS.dusdc)} DUSDC`} highlight />
        <Stat label="Your shares" value={`${fmt(userVstrata, DECIMALS.vstrata)} vSTRATA`} />
      </div>

      {!account ? (
        <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/55">
          👋 Connect a Sui wallet (on <b>testnet</b>) to deposit. You&apos;ll receive vSTRATA shares
          that represent your slice of the vault and grow as it earns.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          <Field
            label="Deposit"
            unit="DUSDC"
            balanceText={`balance ${fmt(userDusdc, DECIMALS.dusdc)}`}
            value={deposit}
            onChange={setDeposit}
            onMax={() => setDeposit(String(userDusdc / 10 ** DECIMALS.dusdc))}
            action="Deposit"
            onAction={runDeposit}
            disabled={isPending}
            hint={previewShares > 0 ? `You'll receive ≈ ${fmt(previewShares, DECIMALS.vstrata)} vSTRATA` : "Earn the option-seller premium from the Predict PLP pool"}
          />
          <Field
            label="Withdraw"
            unit="vSTRATA"
            balanceText={`balance ${fmt(userVstrata, DECIMALS.vstrata)}`}
            value={withdraw}
            onChange={setWithdraw}
            onMax={() => setWithdraw(String(userVstrata / 10 ** DECIMALS.vstrata))}
            action="Withdraw"
            onAction={runWithdraw}
            disabled={isPending}
            hint={previewAssets > 0 ? `You'll receive ≈ ${fmt(previewAssets, DECIMALS.dusdc)} DUSDC` : "Burn shares to get your DUSDC back"}
          />
        </div>
      )}

      {/* transaction log */}
      {activity.length > 0 && (
        <div className="mt-6 border-t border-white/10 pt-4">
          <div className="mb-2 text-xs font-medium text-white/40">Recent activity</div>
          <ul className="space-y-1.5">
            {activity.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-xs">
                <span className="text-white/70">
                  <span className="text-white/90">{a.action}</span> · {a.detail}
                </span>
                <a href={txUrl(a.digest)} target="_blank" rel="noreferrer" className="text-sui hover:text-aqua">
                  Suiscan ↗
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${highlight ? "border-sui/30 bg-sui/5" : "border-white/10 bg-white/[0.02]"}`}>
      <div className="text-xs text-white/40">{label}</div>
      <div className="mt-1 font-mono text-sm">{value}</div>
    </div>
  );
}

function Field({
  label,
  unit,
  balanceText,
  value,
  onChange,
  onMax,
  action,
  onAction,
  disabled,
  hint,
}: {
  label: string;
  unit: string;
  balanceText: string;
  value: string;
  onChange: (v: string) => void;
  onMax: () => void;
  action: string;
  onAction: () => void;
  disabled: boolean;
  hint: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-white/70">{label}</span>
        <span className="text-white/40">{balanceText}</span>
      </div>
      <div className="flex gap-2">
        <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-white/[0.02] px-3">
          <input
            inputMode="decimal"
            placeholder="0.0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-transparent py-2.5 text-sm outline-none"
          />
          <span className="mr-2 text-xs text-white/40">{unit}</span>
          <button onClick={onMax} className="text-xs text-sui hover:text-aqua">MAX</button>
        </div>
        <button
          onClick={onAction}
          disabled={disabled}
          className="rounded-xl bg-sui px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-aqua disabled:opacity-50"
        >
          {disabled ? "…" : action}
        </button>
      </div>
      <div className="mt-1 text-[11px] text-white/40">{hint}</div>
    </div>
  );
}
