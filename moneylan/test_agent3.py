#!/usr/bin/env python3
"""MONEYLAN Agent 3 — Auto-Test-Runner"""

import json, os, time, uuid, requests, sys
from pathlib import Path

BASE_URL = os.environ["N8N_BASE_URL"].rstrip("/")
API_KEY  = os.environ["N8N_API_KEY"]
HEADERS  = {"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"}
WF_ID    = "peVGxOTGY1v2D12B"
WEBHOOK_PATH = f"moneylan-a3-test-{str(uuid.uuid4())[:8]}"

def get_wf():
    r = requests.get(f"{BASE_URL}/api/v1/workflows/{WF_ID}", headers=HEADERS); r.raise_for_status(); return r.json()
def put_wf(wf):
    s = {"executionOrder": wf.get("settings",{}).get("executionOrder","v1")}
    r = requests.put(f"{BASE_URL}/api/v1/workflows/{WF_ID}", headers=HEADERS,
        json={"name":wf["name"],"nodes":wf["nodes"],"connections":wf["connections"],"settings":s,"staticData":wf.get("staticData")})
    return r.ok
def set_active(a):
    requests.post(f"{BASE_URL}/api/v1/workflows/{WF_ID}/{'activate' if a else 'deactivate'}", headers=HEADERS)
def latest_exec():
    r = requests.get(f"{BASE_URL}/api/v1/executions?workflowId={WF_ID}&limit=1", headers=HEADERS)
    d = r.json().get("data",[]); return d[0] if d else None
def exec_detail(eid):
    return requests.get(f"{BASE_URL}/api/v1/executions/{eid}?includeData=true", headers=HEADERS).json()

print("=== Agent 3 Auto-Test ===\n")

wf = get_wf()
nodes, connections = wf["nodes"], wf["connections"]
# Webhook einfügen falls nötig
first_real_node = "Get row(s) in sheet"
if not any(n["name"]=="Test-Webhook-A3" for n in nodes):
    nodes.append({"id":str(uuid.uuid4()),"name":"Test-Webhook-A3","type":"n8n-nodes-base.webhook",
                  "typeVersion":2,"position":[-3600,-928],
                  "parameters":{"path":WEBHOOK_PATH,"responseMode":"onReceived","options":{}}})
    connections["Test-Webhook-A3"] = {"main":[[{"node":first_real_node,"type":"main","index":0}]]}
wf["nodes"]=nodes; wf["connections"]=connections; put_wf(wf)
print(f"✓ Webhook eingefügt ({WEBHOOK_PATH})")

set_active(True); time.sleep(2)
known_id = (latest_exec() or {}).get("id")
print(f"   Letzte Execution: {known_id}")

r = requests.get(f"{BASE_URL}/webhook/{WEBHOOK_PATH}", timeout=15)
print(f"3. Webhook: {r.status_code} — {r.text[:80]}")

print("4. Warte auf Execution (max 5 min)...")
exec_id = None
for i in range(60):
    time.sleep(5)
    ex = latest_exec()
    if not ex: continue
    if ex["id"] == known_id and ex.get("status") not in ("running","waiting"): continue
    if ex.get("status") in ("running","waiting"):
        print(f"   [{i*5}s] {ex['id']} läuft...", end="\r"); exec_id=ex["id"]; continue
    exec_id=ex["id"]; print(f"\n   ✓ Execution {exec_id}: {ex['status']}"); break
else:
    print("\n   TIMEOUT")

set_active(False)
wf2=get_wf(); wf2["nodes"]=[n for n in wf2["nodes"] if n["name"]!="Test-Webhook-A3"]
wf2["connections"].pop("Test-Webhook-A3",None); put_wf(wf2)
print("5. ✓ Bereinigt")

if not exec_id: print("Keine Execution-ID"); sys.exit(1)

d = exec_detail(exec_id)
rdata = d.get("data",{}).get("resultData",{}).get("runData",{})
errors, cred_issues = [], []
print(f"\n6. Execution {exec_id} — {d.get('status','?')}\n")

for node_name, runs in rdata.items():
    for run in (runs or []):
        err = run.get("error")
        items = run.get("data",{}).get("main",[[]])[0] or []
        item0 = items[0].get("json",{}) if items else {}
        if err:
            msg = err.get("message","")
            errors.append((node_name, msg))
            if any(k in msg.lower() for k in ["credential","auth","401","403","forbidden"]):
                cred_issues.append({"agent":"Agent 3","node":node_name,"error":msg[:100]})
        if node_name in ("Vision-Input bauen","Vision (Poe Sonnet)","Merge & Manifest","Merge Vision + Cands"):
            print(f"  [{node_name}] items={len(items)}")
            if node_name == "Vision-Input bauen":
                print(f"    image_count={item0.get('image_count','?')} lead_id={item0.get('lead_id','?')}")
            elif node_name == "Vision (Poe Sonnet)":
                ch = item0.get("choices",[])
                print(f"    Vision: {str(ch[0])[:120] if ch else 'leer'}")
            elif node_name == "Merge & Manifest":
                print(f"    schema={item0.get('schema_version','?')} conf={item0.get('confidence','?')}")
                print(f"    fehlende={item0.get('fehlende_assets',[])} warnings={item0.get('warnings',[])} lead_id={item0.get('lead_id','?')}")
            elif err:
                print(f"    ERROR: {err.get('message','?')[:100]}")

print()
unique_errs = list({f"{a[:30]}:{b[:60]}" for a,b in errors})
if errors:
    print(f"❌ {len(errors)} Fehler ({len(unique_errs)} unique):")
    for e in unique_errs[:6]: print(f"  {e}")
else:
    print("✓ Keine Errors")
if cred_issues:
    print(f"\n⚠️  Credential-Probleme:")
    for c in cred_issues: print(f"  {c['node']}: {c['error']}")
print(f"\nOverall: {'✓ GRÜN' if d.get('status')=='success' else '❌ FEHLER'} ({d.get('status','?')})")
