#!/usr/bin/env python3
"""
MONEYLAN Agent 1 — Build & Deploy
Patcht den bestehenden Workflow in n8n via REST API.
"""

import json, os, uuid, sys, requests
from pathlib import Path

BASE_URL = os.environ["N8N_BASE_URL"].rstrip("/")
API_KEY  = os.environ["N8N_API_KEY"]
HEADERS  = {"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"}
WF_ID    = "8K3BEqjsfl21BAS9"  # bestehender Agent 1

HERE = Path(__file__).parent

# ---- Code-Node-Inhalte laden ----
PSI_VISION_PREP  = (HERE / "code_nodes/psi_vision_prep.js").read_text()
AUDIT_SCORE_V2   = (HERE / "code_nodes/audit_score_v2.js").read_text()

def uid(): return str(uuid.uuid4())


def fetch_workflow():
    r = requests.get(f"{BASE_URL}/api/v1/workflows/{WF_ID}", headers=HEADERS)
    r.raise_for_status()
    return r.json()


def node_by_name(nodes, name):
    for n in nodes:
        if n["name"] == name:
            return n
    return None


def patch_workflow(wf):
    nodes       = wf["nodes"]
    connections = wf["connections"]

    # ------------------------------------------------------------------ #
    # 1. Suchparameter aktualisieren                                       #
    # ------------------------------------------------------------------ #
    sp = node_by_name(nodes, "Suchparameter")
    for a in sp["parameters"]["assignments"]["assignments"]:
        if a["name"] == "ort":
            a["value"] = "Leipzig"
        elif a["name"] == "score_threshold":
            a["value"] = 75
            a["type"]  = "number"
        elif a["name"] == "max_leads":
            a["value"] = 20
            a["type"]  = "number"
        elif a["name"] == "radius_m":
            a["value"] = 3000  # auf Leipzig-City eingegrenzt

    # ------------------------------------------------------------------ #
    # 2. Map -> business: branche + ort mitgeben                          #
    # ------------------------------------------------------------------ #
    mb = node_by_name(nodes, "Map -> business")
    assignments = mb["parameters"]["assignments"]["assignments"]
    existing_names = {a["name"] for a in assignments}
    if "business.branche" not in existing_names:
        assignments.append({"id": uid(), "name": "business.branche",
                            "value": "={{ $('Suchparameter').item.json.branche }}", "type": "string"})
    if "business.ort" not in existing_names:
        assignments.append({"id": uid(), "name": "business.ort",
                            "value": "={{ $('Suchparameter').item.json.ort }}", "type": "string"})

    # ------------------------------------------------------------------ #
    # 3. Alte Nodes entfernen: Map PSI -> psi, Audit & Scoring            #
    # ------------------------------------------------------------------ #
    nodes = [n for n in nodes if n["name"] not in ("Map PSI -> psi", "Audit & Scoring")]

    # ------------------------------------------------------------------ #
    # 4. PageSpeed (desktop) einfügen                                     #
    # Position: nach PageSpeed (mobil) bei [-1584, -928] → [-1376, -928] #
    # ------------------------------------------------------------------ #
    goog_key = "AIzaSyA2_IrB95ZremXFTZ_qqdhyyQ2K3LtM2h4"
    psi_desktop = {
        "id":   uid(),
        "name": "PageSpeed (desktop)",
        "type": "n8n-nodes-base.httpRequest",
        "position": [-1376, -928],
        "parameters": {
            "url": "https://www.googleapis.com/pagespeedonline/v5/runPagespeed",
            "sendQuery": True,
            "queryParameters": {
                "parameters": [
                    {"name": "url",      "value": "={{ $('Prep fuer Audit').item.json.final_url }}"},
                    {"name": "strategy", "value": "desktop"},
                    {"name": "category", "value": "performance"},
                    {"name": "key",      "value": goog_key},
                ]
            },
            "options": {
                "response": {"response": {"neverError": True, "responseFormat": "json"}},
                "timeout": 60000,
            }
        },
        "continueOnFail": True,
    }
    nodes.append(psi_desktop)

    # ------------------------------------------------------------------ #
    # 5. Code: PSI + Vision-Prep                                          #
    # ------------------------------------------------------------------ #
    psi_vision_prep_node = {
        "id":   uid(),
        "name": "PSI + Vision-Prep",
        "type": "n8n-nodes-base.code",
        "position": [-1168, -928],
        "parameters": {
            "mode":   "runOnceForEachItem",
            "jsCode": PSI_VISION_PREP,
        },
        "continueOnFail": True,
    }
    nodes.append(psi_vision_prep_node)

    # ------------------------------------------------------------------ #
    # 6. HTTP: Poe Vision                                                 #
    # ------------------------------------------------------------------ #
    poe_vision_node = {
        "id":   uid(),
        "name": "Poe Vision",
        "type": "n8n-nodes-base.httpRequest",
        "position": [-960, -928],
        "parameters": {
            "method": "POST",
            "url":    "https://api.poe.com/v1/chat/completions",
            "authentication":  "genericCredentialType",
            "genericAuthType": "httpHeaderAuth",
            "sendBody":    True,
            "specifyBody": "json",
            # n8n evaluiert ={{ ... }} als Ausdruck → gibt das Objekt direkt weiter
            "jsonBody": "={{ $json.vision_payload }}",
            "options": {
                "response": {"response": {"neverError": True, "responseFormat": "json"}},
                "timeout": 90000,
            }
        },
        "credentials": {
            "httpHeaderAuth": {"id": "UJ5khOPRpBDsxk6m", "name": "Header Auth account"}
        },
        "continueOnFail": True,
    }
    nodes.append(poe_vision_node)

    # ------------------------------------------------------------------ #
    # 7. Code: Audit & Score v2                                           #
    # ------------------------------------------------------------------ #
    audit_score_v2_node = {
        "id":   uid(),
        "name": "Audit & Score v2",
        "type": "n8n-nodes-base.code",
        "position": [-752, -928],
        "parameters": {
            "mode":   "runOnceForEachItem",
            "jsCode": AUDIT_SCORE_V2,
        },
        "continueOnFail": True,
    }
    nodes.append(audit_score_v2_node)

    # ------------------------------------------------------------------ #
    # 8. Google Sheets: Spalten auf Schema v2.0 erweitern                 #
    # ------------------------------------------------------------------ #
    gs = node_by_name(nodes, "Google Sheets (fuer mich)")
    gs["parameters"]["columns"]["value"] = {
        "lead_id":                "={{ $json.lead_id }}",
        "name":                   "={{ $json.business.name }}",
        "score":                  "={{ $json.score }}",
        "confidence":             "={{ $json.confidence }}",
        "website":                "={{ $json.business.website }}",
        "phone":                  "={{ $json.business.phone }}",
        "address":                "={{ $json.business.address }}",
        "google_rating":          "={{ $json.business.google_rating }}",
        "google_reviews":         "={{ $json.business.google_reviews_count }}",
        "visual_modernity_score": "={{ $json.audit_visual?.visual_modernity_score }}",
        "hero_quality":           "={{ $json.audit_visual?.hero_quality }}",
        "cta_above_fold":         "={{ $json.audit_visual?.cta_above_fold }}",
        "psi_performance":        "={{ $json.audit_technical?.psi_performance_mobile }}",
        "has_https":              "={{ $json.audit_technical?.https }}",
        "verkaufsargumente":      "={{ $json.verkaufsargumente?.join(' | ') }}",
        "warnings":               "={{ $json.warnings?.join(', ') }}",
        "generated_at":           "={{ $json.generated_at }}",
    }
    # Schema-Entries aktualisieren
    gs["parameters"]["columns"]["schema"] = [
        {"id": k, "displayName": k, "required": False, "defaultMatch": False,
         "display": True, "type": "string", "canBeUsedToMatch": True}
        for k in gs["parameters"]["columns"]["value"].keys()
    ]

    # ------------------------------------------------------------------ #
    # 9. Baue Pipeline-JSON: schema_version auf 2.0                       #
    # ------------------------------------------------------------------ #
    bpj = node_by_name(nodes, "Baue Pipeline-JSON")
    for a in bpj["parameters"]["assignments"]["assignments"]:
        if a["name"] == "schema_version":
            a["value"] = "2.0"

    # ------------------------------------------------------------------ #
    # 10. Connections neu verdrahten                                       #
    # ------------------------------------------------------------------ #
    # Alte Verbindungen entfernen
    connections.pop("Map PSI -> psi", None)
    connections.pop("Audit & Scoring", None)

    # PageSpeed (mobil) → PageSpeed (desktop)
    connections["PageSpeed (mobil)"]["main"][0] = [
        {"node": "PageSpeed (desktop)", "type": "main", "index": 0}
    ]

    # Neue Kette
    connections["PageSpeed (desktop)"]  = {"main": [[{"node": "PSI + Vision-Prep",   "type": "main", "index": 0}]]}
    connections["PSI + Vision-Prep"]    = {"main": [[{"node": "Poe Vision",           "type": "main", "index": 0}]]}
    connections["Poe Vision"]           = {"main": [[{"node": "Audit & Score v2",     "type": "main", "index": 0}]]}
    connections["Audit & Score v2"]     = {"main": [[{"node": "Loop je Lead",         "type": "main", "index": 0}]]}

    wf["nodes"]       = nodes
    wf["connections"] = connections
    return wf


def deploy(wf):
    # n8n REST-API akzeptiert nur executionOrder in settings
    settings = {"executionOrder": wf.get("settings", {}).get("executionOrder", "v1")}

    payload = {
        "name":        wf["name"],
        "nodes":       wf["nodes"],
        "connections": wf["connections"],
        "settings":    settings,
        "staticData":  wf.get("staticData", None),
    }
    r = requests.put(
        f"{BASE_URL}/api/v1/workflows/{WF_ID}",
        headers=HEADERS,
        json=payload
    )
    if not r.ok:
        print(f"FEHLER {r.status_code}: {r.text[:800]}")
        sys.exit(1)
    print(f"✓ Workflow geupdated: {r.json()['id']}")
    return r.json()


def save_local(wf):
    out = HERE / "workflow_agent1.json"
    out.write_text(json.dumps(wf, indent=2, ensure_ascii=False))
    print(f"✓ Lokal gespeichert: {out}")


if __name__ == "__main__":
    print("=== MONEYLAN Agent 1 — Build & Deploy ===")
    wf = fetch_workflow()
    print(f"  Workflow geladen: {wf['name']} ({len(wf['nodes'])} Nodes)")
    wf = patch_workflow(wf)
    print(f"  Patched: {len(wf['nodes'])} Nodes")
    result = deploy(wf)
    save_local(wf)
    print(f"\n✓ Fertig! Workflow ID: {result['id']}, aktiv: {result.get('active')}")
