#!/usr/bin/env python3
"""MONEYLAN Agent 2 — Auto-Test-Runner"""

import json, os, time, uuid, requests, sys
from pathlib import Path

BASE_URL = os.environ["N8N_BASE_URL"].rstrip("/")
API_KEY  = os.environ["N8N_API_KEY"]
HEADERS  = {"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"}
WF_ID    = "04XC92MJvaYKtjbi"
WEBHOOK_PATH = f"moneylan-a2-test-{str(uuid.uuid4())[:8]}"

def get_wf():
    r = requests.get(f"{BASE_URL}/api/v1/workflows/{WF_ID}", headers=HEADERS); r.raise_for_status(); return r.json()
def put_wf(wf):
    s = {"executionOrder": wf.get("settings",{}).get("executionOrder","v1")}
    r = requests.put(f"{BASE_URL}/api/v1/workflows/{WF_ID}", headers=HEADERS,
                     json={"name":wf["name"],"nodes":wf["nodes"],"connections":wf["connections"],"settings":s,"staticData":wf.get("staticData")})
    return r.ok
def set_active(a):
    ep = "activate" if a else "deactivate"
    requests.post(f"{BASE_URL}/api/v1/workflows/{WF_ID}/{ep}", headers=HEADERS)
def latest_exec():
    r = requests.get(f"{BASE_URL}/api/v1/executions?workflowId={WF_ID}&limit=1", headers=HEADERS)
    d = r.json().get("data",[]); return d[0] if d else None
def exec_detail(eid):
    r = requests.get(f"{BASE_URL}/api/v1/executions/{eid}?includeData=true", headers=HEADERS)
    return r.json()

print("=== Agent 2 Auto-Test ===\n")

# 1. Webhook-Trigger hinzufügen
wf = get_wf()
nodes, connections = wf["nodes"], wf["connections"]
if not any(n["name"]=="Test-Webhook" for n in nodes):
    nodes.append({"id":str(uuid.uuid4()),"name":"Test-Webhook","type":"n8n-nodes-base.webhook",
                  "typeVersion":2,"position":[-3600,-928],
                  "parameters":{"path":WEBHOOK_PATH,"responseMode":"onReceived","options":{}}})
    connections["Test-Webhook"] = {"main":[[{"node":"Get row(s) in sheet1","type":"main","index":0}]]}
wf["nodes"] = nodes; wf["connections"] = connections
put_wf(wf)
print(f"✓ Webhook hinzugefügt")

# 2. Aktivieren
set_active(True); time.sleep(2)
known_id = (latest_exec() or {}).get("id")
print(f"   Letzte Execution: {known_id}")

# 3. Feuern
url = f"{BASE_URL}/webhook/{WEBHOOK_PATH}"
r = requests.get(url, timeout=15)
print(f"3. Webhook: {r.status_code} — {r.text[:80]}")

# 4. Pollen
print("4. Warte auf Execution (max 5 min)...")
exec_id = None
for i in range(60):
    time.sleep(5)
    ex = latest_exec()
    if not ex: continue
    if ex["id"] == known_id and ex.get("status") not in ("running","waiting"):
        continue
    if ex.get("status") in ("running","waiting"):
        print(f"   [{i*5}s] {ex['id']} läuft...", end="\r"); exec_id=ex["id"]; continue
    exec_id = ex["id"]
    print(f"\n   ✓ Execution {exec_id}: {ex['status']}"); break
else:
    print("\n   TIMEOUT")

# 5. Aufräumen
set_active(False)
wf2 = get_wf(); wf2["nodes"] = [n for n in wf2["nodes"] if n["name"]!="Test-Webhook"]
wf2["connections"].pop("Test-Webhook",None); put_wf(wf2)
print("5. ✓ Bereinigt")

if not exec_id:
    print("Keine Execution-ID"); sys.exit(1)

# 6. Analysieren
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
            if any(k in msg.lower() for k in ["credential","auth","401","403","forbidden","unauthorized"]):
                cred_issues.append({"agent":"Agent 2","node":node_name,"error":msg[:100]})
        # Summary wichtiger Nodes
        if node_name in ("Merge & Manifest1","Roh-Extraktion1","LLM: Strukturieren (Poe Sonnet)1"):
            print(f"  [{node_name}]")
            if node_name=="Merge & Manifest1":
                print(f"    schema={item0.get('schema_version','?')} confidence={item0.get('confidence','?')}")
                print(f"    missing={item0.get('missing_fields',[])} warnings={item0.get('warnings',[])} lead_id={item0.get('lead_id','?')}")
            elif node_name=="LLM: Strukturieren (Poe Sonnet)1":
                ch = item0.get("choices",[])
                print(f"    LLM antwortet: {str(ch[0])[:150] if ch else 'leer'}")

print()
if errors:
    print(f"❌ {len(errors)} Fehler:")
    for n,m in errors: print(f"  [{n}] {m[:150]}")
else:
    print("✓ Keine Errors")
if cred_issues:
    print(f"\n⚠️  Credential-Probleme:")
    for c in cred_issues: print(f"  {c['agent']} | {c['node']} | {c['error']}")
print(f"\nOverall: {'✓ GRÜN' if d.get('status')=='success' else '❌ FEHLER'}")
