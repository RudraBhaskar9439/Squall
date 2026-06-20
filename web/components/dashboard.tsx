"use client";

import {
  ConnectButton,
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Transaction, coinWithBalance } from "@mysten/sui/transactions";
import { useEffect, useState } from "react";
import {
  STRATA,
  TYPES,
  DECIMALS,
  OFFSET_POW,
  txUrl,
  walruscanUrl,
  writeSnapshotToWalrus,
  LIVE_SNAPSHOTS_KEY,
  SNAPSHOT_EVENT,
  type TrackEntry,
} from "@/lib/strata";
import { useToast } from "./toast";

function pu64(f: unknown): number {
  if (f == null) return 0;
  if (typeof f === "string" || typeof f === "number") return Number(f);
  const o = f as { value?: unknown; fields?: { value?: unknown } };
  if (o.fields?.value != null) return Number(o.fields.value);
  if (o.value != null) return Number(o.value);
  return 0;
}

const fmt = (base: number, dec: number, max = 2) =>
  (base / 10 ** dec).toLocaleString(undefined, { maximumFractionDigits: max });

type Activity = { id: number; action: string; detail: string; digest: string };

export function VaultDashboard() {
  const account = useCurrentAccount();
  const toast = useToast();
  const client = useSuiClient();
  const { mutate: signAndExecute, isPending } = useSignAndExecuteTransaction();
  const [deposit, setDeposit] = useState("");
  const [withdraw, setWithdraw] = useState("");
  const [activity, setActivity] = useState<Activity[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [apy, setApy] = useState<number | null>(null);

  useEffect(() => {
    const s = localStorage.getItem("strata-activity");
    if (s) setActivity(JSON.parse(s));
    fetch("/simulation.json")
      .then((r) => r.json())
      .then((d) => setApy(d?.monteCarlo?.hedged?.apy ?? null))
      .catch(() => {});
  }, []);

  function logActivity(action: string, detail: string, digest: string) {
    setActivity((prev) => {
      const next = [{ id: Date.now(), action, detail, digest }, ...prev].slice(0, 6);
      localStorage.setItem("strata-activity", JSON.stringify(next));
      return next;
    });
  }

  // After any vault action, snapshot the fresh on-chain NAV to Walrus so the
  // proof tab updates instantly — the verifiable track record in real time.
  async function recordSnapshot(action: string, detail: string) {
    try {
      toast.push({ variant: "info", title: "Recording proof to Walrus…", desc: "writing an immutable NAV snapshot" });
      const [vaultObj, volObj] = await Promise.all([
        client.getObject({ id: STRATA.vault, options: { showContent: true } }),
        client.getObject({ id: STRATA.volIndex, options: { showContent: true } }),
      ]);
      const vc = vaultObj.data?.content;
      const vf = (vc && "fields" in vc ? vc.fields : null) as Record<string, unknown> | null;
      const oc = volObj.data?.content;
      const of = (oc && "fields" in oc ? oc.fields : null) as Record<string, unknown> | null;
      const sIdle = vf ? pu64(vf.idle) : 0;
      const sDeployed = vf ? pu64(vf.deployed_value) : 0;
      const sTreasury = vf?.treasury as { fields?: { total_supply?: unknown } } | undefined;
      const snap = {
        epoch: Date.now(),
        tsMs: Date.now(),
        navAssets: sIdle + sDeployed,
        totalShares: pu64(sTreasury?.fields?.total_supply),
        idle: sIdle,
        deployed: sDeployed,
        volIndex: of ? pu64(of.value) : 0,
        rationale: `${action} (${detail}) — NAV committed to Walrus`,
      };
      const blobId = await writeSnapshotToWalrus(snap);
      const entry: TrackEntry = { ...snap, blobId, isLive: true };
      const prev: TrackEntry[] = JSON.parse(localStorage.getItem(LIVE_SNAPSHOTS_KEY) || "[]");
      localStorage.setItem(LIVE_SNAPSHOTS_KEY, JSON.stringify([entry, ...prev].slice(0, 25)));
      window.dispatchEvent(new CustomEvent(SNAPSHOT_EVENT));
      toast.push({
        variant: "success",
        title: "Proof stored on Walrus",
        desc: `NAV ${fmt(snap.navAssets, DECIMALS.dusdc)} DUSDC · immutable`,
        href: walruscanUrl(blobId),
      });
    } catch (e) {
      toast.push({ variant: "error", title: "Walrus snapshot skipped", desc: e instanceof Error ? e.message : String(e) });
    }
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

  const depBase = Math.floor((parseFloat(deposit) || 0) * 10 ** DECIMALS.dusdc);
  const previewShares = depBase > 0 ? (depBase * (totalShares + OFFSET_POW)) / (totalAssets + 1) : 0;
  const wdBase = Math.floor((parseFloat(withdraw) || 0) * 10 ** DECIMALS.vstrata);
  const previewAssets =
    wdBase > 0 && totalShares > 0 ? (wdBase * (totalAssets + 1)) / (totalShares + OFFSET_POW) : 0;

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
          // snapshot the resulting NAV to Walrus (fire-and-forget; gives the chain a moment to settle)
          setTimeout(() => recordSnapshot(action, detail), 1500);
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
    send(tx, "Deposit", `${deposit} USDC`, () => setDeposit(""));
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
    send(tx, "Withdraw", `${withdraw} shares`, () => setWithdraw(""));
  }

  return (
    <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#0b2a40]/35 backdrop-blur-md p-8">
      {/* header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold">Earn on Predict</div>
          <p className="mt-1 text-sm text-white/55">
            Deposit USDC. The vault is the house — it earns a share of trading fees. Withdraw anytime.
          </p>
        </div>
        <ConnectButton />
      </div>

      {/* honest APY chip */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <a
          href="/#sim"
          className="rounded-full border border-teal/30 bg-teal/5 px-3 py-1.5 text-xs text-teal hover:bg-teal/10"
        >
          ~{apy != null ? Math.round(apy * 100) : 17}% APY · backtested
        </a>
        <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/40">
          hedged · not a guarantee, you can lose
        </span>
      </div>

      {/* the two numbers that matter */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <Big label="Your balance" value={`${fmt(positionValue, DECIMALS.dusdc)}`} unit="USDC" highlight />
        <Big label="Total deposited" value={`${fmt(totalAssets, DECIMALS.dusdc)}`} unit="USDC" />
      </div>

      {!account ? (
        <p className="mt-6 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-white/55">
          👋 Connect a Sui wallet (testnet) to start earning.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          <Field
            label="Deposit"
            unit="USDC"
            balanceText={`balance ${fmt(userDusdc, DECIMALS.dusdc)}`}
            value={deposit}
            onChange={setDeposit}
            onMax={() => setDeposit(String(userDusdc / 10 ** DECIMALS.dusdc))}
            action="Deposit"
            onAction={runDeposit}
            disabled={isPending}
            hint={previewShares > 0 ? `You'll get ≈ ${fmt(previewShares, DECIMALS.vstrata)} shares` : "Start earning a share of the vault"}
          />
          <Field
            label="Withdraw"
            unit="shares"
            balanceText={`balance ${fmt(userVstrata, DECIMALS.vstrata)}`}
            value={withdraw}
            onChange={setWithdraw}
            onMax={() => setWithdraw(String(userVstrata / 10 ** DECIMALS.vstrata))}
            action="Withdraw"
            onAction={runWithdraw}
            disabled={isPending}
            hint={previewAssets > 0 ? `You'll get back ≈ ${fmt(previewAssets, DECIMALS.dusdc)} USDC` : "Cash out anytime"}
          />
        </div>
      )}

      {/* details for the curious (hidden by default) */}
      <button
        onClick={() => setShowDetails((s) => !s)}
        className="mt-6 self-start text-xs text-white/40 hover:text-white/70"
      >
        {showDetails ? "Hide details ▲" : "Under the hood ▾"}
      </button>
      {showDetails && (
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <Detail label="Idle (not deployed)" value={`${fmt(idle, DECIMALS.dusdc)} USDC`} />
          <Detail label="Earning in Predict PLP" value={`${fmt(deployed, DECIMALS.dusdc)} USDC`} />
          <Detail label="Your shares (vSTRATA)" value={fmt(userVstrata, DECIMALS.vstrata)} />
          <Detail label="Share price" value={totalShares > 0 ? (totalAssets / 10 ** DECIMALS.dusdc / (totalShares / 10 ** DECIMALS.vstrata)).toFixed(4) : "—"} />
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

function Big({ label, value, unit, highlight }: { label: string; value: string; unit: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${highlight ? "border-sui/30 bg-sui/5" : "border-white/10 bg-white/[0.02]"}`}>
      <div className="text-xs text-white/40">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-mono text-2xl font-semibold">{value}</span>
        <span className="text-xs text-white/40">{unit}</span>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
      <div className="text-white/40">{label}</div>
      <div className="mt-1 font-mono text-white/80">{value}</div>
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
