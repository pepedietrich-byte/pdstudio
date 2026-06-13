#!/usr/bin/env python3
"""
MONEYLAN Agent 1 — Auto-Test-Runner
Fügt temporären Webhook-Trigger ein, feuert ihn, pollt Execution-Ergebnisse,
gibt alle Node-Fehler aus.
"""

import json, os, sys, time, uuid, requests
from pathlib import Path

BASE_URL = os.environ["N8N_BASE_URL"].rstrip("/")
API_KEY  = os.environ["N8N_API_KEY"]
HEADERS  = {"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"}
WF_ID    = "8K3BEqjsfl21BAS9"
WEBHOOK_PATH = f"moneylan-a1-test-{str(uuid.uuid4())[:8]}"


def get_workflow():
    r = requests.get(f"{BASE_URL}/api/v1/workflows/{WF_ID}", headers=HEADERS)
    r.raise_for_status()
    return r.json()


def update_workflow(wf):
    settings = {"executionOrder": wf.get("settings", {}).get("executionOrder", "v1")}
    payload = {"name": wf["name"], "nodes": wf["nodes"],
               "connections": wf["connections"], "settings": settings,
               "staticData": wf.get("staticData")}
    r = requests.put(f"{BASE_URL}/api/v1/workflows/{WF_ID}", headers=HEADERS, json=payload)
    if not r.ok:
        print(f"  Update-Fehler {r.status_code}: {r.text[:400]}")
        return None
    return r.json()


def set_active(active: bool):
    endpoint = "activate" if active else "deactivate"
    r = requests.post(f"{BASE_URL}/api/v1/workflows/{WF_ID}/{endpoint}", headers=HEADERS)
    if not r.ok:
        print(f"  {endpoint} Fehler: {r.text[:200]}")
    return r.ok


def get_latest_execution():
    r = requests.get(f"{BASE_URL}/api/v1/executions?workflowId={WF_ID}&limit=1",
                     headers=HEADERS)
    if not r.ok:
        return None
    data = r.json().get("data", [])
    return data[0] if data else None


def get_execution_detail(exec_id):
    r = requests.get(f"{BASE_URL}/api/v1/executions/{exec_id}?includeData=true",
                     headers=HEADERS)
    if not r.ok:
        return None
    return r.json()


def node_by_name(nodes, name):
    for n in nodes:
        if n["name"] == name:
            return n
    return None


# ---- Schritt 1: max_leads auf 1 setzen + Webhook-Trigger hinzufügen ----
print("=== Agent 1 Auto-Test ===\n")
print("1. Workflow vorbereiten (max_leads=1, Webhook-Trigger)...")

wf = get_workflow()
nodes = wf["nodes"]
connections = wf["connections"]

# max_leads → 1
sp = node_by_name(nodes, "Suchparameter")
for a in sp["parameters"]["assignments"]["assignments"]:
    if a["name"] == "max_leads":
        a["value"] = 1

# Webhook-Node hinzufügen (falls nicht schon drin)
if not node_by_name(nodes, "Test-Webhook"):
    wh_node = {
        "id": str(uuid.uuid4()), "name": "Test-Webhook",
        "type": "n8n-nodes-base.webhook",
        "position": [-3600, -928],
        "parameters": {
            "path": WEBHOOK_PATH,
            "responseMode": "onReceived",
            "options": {}
        }
    }
    nodes.append(wh_node)
    # Webhook → Suchparameter verbinden
    connections["Test-Webhook"] = {
        "main": [[{"node": "Suchparameter", "type": "main", "index": 0}]]
    }

wf["nodes"] = nodes
wf["connections"] = connections
result = update_workflow(wf)
if not result:
    sys.exit(1)
print("   ✓ Workflow aktualisiert")

# ---- Schritt 2: Aktivieren ----
print("2. Workflow aktivieren...")
if not set_active(True):
    print("   FEHLER beim Aktivieren")
    sys.exit(1)
print("   ✓ Aktiv")
time.sleep(2)

# ---- Schritt 3: Letzte bekannte Execution-ID merken ----
known_exec = get_latest_execution()
known_id = known_exec["id"] if known_exec else None
print(f"   Letzte bekannte Execution-ID: {known_id}")

# ---- Schritt 3b: Webhook feuern (GET + POST versuchen) ----
webhook_url = f"{BASE_URL}/webhook/{WEBHOOK_PATH}"
print(f"3. Webhook feuern: {webhook_url}")
triggered = False
for method in ["GET", "POST"]:
    try:
        fn = requests.get if method == "GET" else requests.post
        r = fn(webhook_url, timeout=15)
        print(f"   {method}: {r.status_code} — {r.text[:120]}")
        if r.status_code < 400:
            triggered = True
            break
    except Exception as e:
        print(f"   {method} Fehler: {e}")

if not triggered:
    print("   ⚠️  Webhook nicht erreichbar — Workflow evtl. trotzdem gestartet")

# ---- Schritt 4: Auf NEUE Execution warten ----
print("4. Warte auf NEUE Execution-Ergebnis (max 5 min)...")
exec_id = None
for i in range(60):
    time.sleep(5)
    ex = get_latest_execution()
    if not ex:
        continue
    # Nur neue Execution akzeptieren (nicht die bekannte)
    if ex["id"] == known_id and ex.get("status") not in ("running", "waiting"):
        print(f"   [{i*5}s] Warte auf neue Execution (bisher nur {known_id})...", end="\r")
        continue
    if ex.get("status") in ("running", "waiting"):
        print(f"   [{i*5}s] Execution {ex['id']} läuft...", end="\r")
        exec_id = ex["id"]
        continue
    exec_id = ex["id"]
    print(f"\n   ✓ Execution {exec_id} beendet: Status = {ex['status']}")
    break
else:
    print("\n   TIMEOUT — keine neue Execution erkannt")

# ---- Schritt 5: Deaktivieren + Webhook entfernen ----
print("5. Workflow deaktivieren + aufräumen...")
set_active(False)
# Webhook-Node entfernen
wf2 = get_workflow()
wf2["nodes"] = [n for n in wf2["nodes"] if n["name"] != "Test-Webhook"]
wf2["connections"].pop("Test-Webhook", None)
update_workflow(wf2)
print("   ✓ Bereinigt")

# ---- Schritt 6: Fehler analysieren ----
if not exec_id:
    print("\n❌ Keine Execution-ID — Workflow hat möglicherweise nie gestartet.")
    sys.exit(1)

print(f"\n6. Execution {exec_id} analysieren...")
detail = get_execution_detail(exec_id)
if not detail:
    print("   Keine Detail-Daten verfügbar.")
    sys.exit(1)

overall_status = detail.get("status", "?")
print(f"   Overall Status: {overall_status}")

# Node-Daten auslesen
run_data = detail.get("data", {}).get("resultData", {}).get("runData", {})
cred_issues = []
errors_found = []

for node_name, node_runs in run_data.items():
    for run in (node_runs or []):
        err = run.get("error")
        if err:
            msg = err.get("message", str(err))
            errors_found.append((node_name, msg))
            # Credential-Fehler erkennen
            if any(kw in msg.lower() for kw in ["credential", "auth", "unauthorized", "403", "401", "forbidden"]):
                cred_issues.append({"agent": "Agent 1", "node": node_name, "error": msg})

        # Output prüfen
        items = run.get("data", {}).get("main", [[]])[0] or []
        if items:
            first = items[0].get("json", {}) if items else {}
            # Kurz-Summary für wichtige Nodes
            if node_name in ("Audit & Score v2", "PSI + Vision-Prep", "Poe Vision"):
                print(f"\n   [{node_name}]")
                if node_name == "Audit & Score v2":
                    print(f"     score={first.get('score','?')} confidence={first.get('confidence','?')}")
                    print(f"     warnings={first.get('warnings',[])} lead_id={first.get('lead_id','?')}")
                elif node_name == "PSI + Vision-Prep":
                    print(f"     psi_perf={first.get('psi',{}).get('performance','?')}")
                    print(f"     has_desktop_screenshot={'screenshot_desktop_b64' in first and bool(first['screenshot_desktop_b64'])}")
                    print(f"     warnings={first.get('warnings',[])} ")
                elif node_name == "Poe Vision":
                    choices = first.get("choices", [])
                    if choices:
                        print(f"     Vision antwortet: {str(choices[0])[:150]}")
                    else:
                        print(f"     choices=[leer] — Raw: {str(first)[:200]}")

print("\n" + "="*60)
if errors_found:
    print(f"❌ {len(errors_found)} Fehler gefunden:\n")
    for node, msg in errors_found:
        print(f"  [{node}] {msg[:200]}")
else:
    print("✓ Keine Errors in Node-Outputs")

if cred_issues:
    print(f"\n⚠️  Credential-Probleme ({len(cred_issues)}):")
    for c in cred_issues:
        print(f"  Agent: {c['agent']} | Node: {c['node']} | Fehler: {c['error'][:100]}")

print(f"\nOverall: {'✓ GRÜN' if overall_status == 'success' else '❌ FEHLER'} (Status: {overall_status})")
