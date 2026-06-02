#!/usr/bin/env python3
"""Live checks: on-chain vault + vol index, Walrus snapshot, and app routes.
Reads addresses from deployments/testnet.json so it never drifts."""
import json, os, sys, urllib.request

ROOT = os.environ.get("ROOT", os.path.join(os.path.dirname(__file__), ".."))
RPC = "https://fullnode.testnet.sui.io:443"
WALRUS = "https://aggregator.walrus-testnet.walrus.space/v1/blobs"

S = json.load(open(f"{ROOT}/deployments/testnet.json"))["strata"]
P = F = 0


def ok(m):
    global P
    P += 1
    print("  ✅", m)


def bad(m):
    global F
    F += 1
    print("  ❌", m)


def rpc(method, params):
    req = urllib.request.Request(
        RPC,
        data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(),
        headers={"Content-Type": "application/json"},
    )
    return json.load(urllib.request.urlopen(req, timeout=20))["result"]


def u64(x):
    if isinstance(x, dict):
        return int(x.get("fields", {}).get("value", x.get("value", 0)))
    return int(x)


# 1. vault
try:
    f = rpc("sui_getObject", [S["vault"], {"showContent": True}])["data"]["content"]["fields"]
    idle = u64(f["idle"])
    dep = int(f["deployed_value"])
    sh = int(f["treasury"]["fields"]["total_supply"]["fields"]["value"])
    tvl = (idle + dep) / 1e6
    price = tvl / (sh / 1e9) if sh else 0
    paused = f["config"]["fields"]["paused"]
    ok(f"vault live — TVL {tvl:.2f} USDC, shares {sh/1e9:.2f}, price {price:.4f}, paused={paused}")
    if paused:
        bad("vault is PAUSED")
except Exception as e:
    bad(f"vault read failed: {e}")

# 2. vol index
try:
    f = rpc("sui_getObject", [S["volIndex"], {"showContent": True}])["data"]["content"]["fields"]
    ok(f"vol index live — {int(f['value'])/1e4:.2f}% ({f['updates']} update(s))")
except Exception as e:
    bad(f"vol index read failed: {e}")

# 3. walrus (verify the latest snapshot still matches)
try:
    man = json.load(open(f"{ROOT}/web/public/track-record.json"))
    e = man["entries"][-1]
    req = urllib.request.Request(f"{WALRUS}/{e['blobId']}", headers={"User-Agent": "curl/8"})
    blob = json.load(urllib.request.urlopen(req, timeout=25))
    if blob.get("navAssets") == e["navAssets"]:
        ok(f"walrus snapshot verified (epoch {blob['epoch']}, NAV {blob['navAssets']/1e6:.2f})")
    else:
        bad("walrus snapshot mismatch")
except Exception as e:
    bad(f"walrus check failed: {e}")

# 4. app routes (optional — only if dev server is running)
for port in (3001, 3000):
    try:
        for path in ("/", "/vault"):
            if urllib.request.urlopen(f"http://localhost:{port}{path}", timeout=5).getcode() != 200:
                raise Exception(path)
        ok(f"app routes 200 on :{port} (/ and /vault)")
        break
    except Exception:
        continue
else:
    print("  ⚠️  app not running locally (start with: cd web && pnpm dev)")

print(f"\nLIVE: {P} passed, {F} failed")
sys.exit(1 if F else 0)
