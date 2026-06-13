#!/usr/bin/env python3
"""
MONEYLAN Agent 4 — Build & Deploy (von Null)
Erstellt den Data Validator Workflow via n8n public REST API.
"""

import json, os, sys, uuid, requests
from pathlib import Path

BASE_URL = os.environ["N8N_BASE_URL"].rstrip("/")
API_KEY  = os.environ["N8N_API_KEY"]
HEADERS  = {"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"}

HERE         = Path(__file__).parent
VALIDATE_ALL = (HERE / "code_nodes/validate_all.js").read_text()
GATE_CODE    = (HERE / "code_nodes/gate_decision.js").read_text()

GS_CRED       = {"googleApi": {"id": "EsWUzcrYxH8tX93F", "name": "Google Service Account account"}}
SHEETS_DOC_ID = "1Fjw6K4MY-H3KfsM4CrZ9BAbDQ0cOKosqAGVsqqftpjc"

def uid(): return str(uuid.uuid4())

# ---- Node-Definitionen ----

NODES = [
    # 0. Manual Trigger
    {
        "id": uid(), "name": "Start Agent 4",
        "type": "n8n-nodes-base.manualTrigger",
        "position": [-2400, -928], "parameters": {},
    },
    # 1. Suchparameter
    {
        "id": uid(), "name": "Suchparameter",
        "type": "n8n-nodes-base.set",
        "position": [-2200, -928],
        "parameters": {
            "assignments": {"assignments": [
                {"id": uid(), "name": "score_threshold", "value": 75,    "type": "number"},
                {"id": uid(), "name": "gate_threshold",  "value": 70,    "type": "number"},
            ]}
        },
    },
    # 2. Leads aus LEADS-Sheet lesen
    {
        "id": uid(), "name": "LEADS holen",
        "type": "n8n-nodes-base.googleSheets",
        "position": [-2000, -928],
        "parameters": {
            "authentication": "serviceAccount",
            "resource":   "sheet",
            "operation":  "read",
            "documentId": {"__rl": True, "value": SHEETS_DOC_ID, "mode": "id"},
            "sheetName":  {"__rl": True, "mode": "name", "value": "LEADS"},
            "options": {},
        },
        "credentials": GS_CRED,
    },
    # 3. Code: Map Sheet → Lead-Objekt, Filter Score >= Threshold
    {
        "id": uid(), "name": "Map & Filter Leads",
        "type": "n8n-nodes-base.code",
        "position": [-1800, -928],
        "parameters": {
            "mode": "runOnceForAllItems",
            "jsCode": r"""
const threshold = $('Suchparameter').first().json.score_threshold || 75;
const items = $input.all();
return items
  .filter(it => Number(it.json.score || 0) >= threshold)
  .map(it => {
    const r = it.json;
    return { json: {
      lead_id: r.lead_id,
      score:   Number(r.score || 0),
      name:    r.name    || null,
      website: r.website || null,
      phone:   r.phone   || null,
      address: r.address || null,
      google_rating:  r.google_rating  ? Number(r.google_rating)  : null,
      google_reviews: r.google_reviews ? Number(r.google_reviews) : null,
      confidence:     r.confidence     ? Number(r.confidence)     : null,
    }};
  });
""",
        },
    },
    # 4. Loop je Lead
    {
        "id": uid(), "name": "Loop je Lead",
        "type": "n8n-nodes-base.splitInBatches",
        "position": [-1600, -928],
        "parameters": {"batchSize": 1, "options": {}},
    },
    # 5. Code: Quellen laden + alle Regeln
    {
        "id": uid(), "name": "Validierung",
        "type": "n8n-nodes-base.code",
        "position": [-1400, -928],
        "parameters": {"mode": "runOnceForEachItem", "jsCode": VALIDATE_ALL},
        "continueOnFail": True,
    },
    # 6. Code: Gate-Entscheidung + File write
    {
        "id": uid(), "name": "Gate & Write",
        "type": "n8n-nodes-base.code",
        "position": [-1200, -928],
        "parameters": {"mode": "runOnceForEachItem", "jsCode": GATE_CODE},
        "continueOnFail": True,
    },
    # 7. Google Sheets: VALIDATION upsert
    {
        "id": uid(), "name": "Sheet: Validation schreiben",
        "type": "n8n-nodes-base.googleSheets",
        "position": [-1000, -928],
        "parameters": {
            "authentication": "serviceAccount",
            "resource":    "sheet",
            "operation":   "appendOrUpdate",
            "documentId":  {"__rl": True, "value": SHEETS_DOC_ID, "mode": "id"},
            "sheetName":   {"__rl": True, "mode": "name", "value": "VALIDATION"},
            "columns": {
                "mappingMode": "defineBelow",
                "matchingColumns": ["lead_id"],
                "value": {
                    "lead_id":            "={{ $json.lead_id }}",
                    "ready_for_concept":  "={{ $json.ready_for_concept }}",
                    "data_quality_score": "={{ $json.data_quality_score }}",
                    "completeness":       "={{ $json.dimensions?.completeness }}",
                    "consistency":        "={{ $json.dimensions?.consistency }}",
                    "validity":           "={{ $json.dimensions?.validity }}",
                    "missing_critical":   "={{ ($json.missing_critical || []).join(' | ') }}",
                    "missing_optional":   "={{ ($json.missing_optional || []).join(' | ') }}",
                    "conflicts":          "={{ ($json.conflicts || []).map(c => c.field + ':' + c.severity).join(', ') }}",
                    "build_risk_level":   "={{ $json.build_risk?.level }}",
                    "would_be_generic":   "={{ $json.build_risk?.would_be_generic }}",
                    "rueckgabe_an":       "={{ ($json.rückgabe_an || []).map(r => r.agent + ':' + r.feld).join(', ') }}",
                    "ersatzstrategie":    "={{ ($json.ersatzstrategie || []).join(' | ') }}",
                    "confidence":         "={{ $json.confidence }}",
                    "warnings":           "={{ ($json.warnings || []).join(', ') }}",
                    "generated_at":       "={{ $json.generated_at }}",
                },
                "schema": [
                    {"id": k, "displayName": k, "required": False, "defaultMatch": False,
                     "display": True, "type": "string", "canBeUsedToMatch": True}
                    for k in [
                        "lead_id","ready_for_concept","data_quality_score","completeness",
                        "consistency","validity","missing_critical","missing_optional",
                        "conflicts","build_risk_level","would_be_generic","rueckgabe_an",
                        "ersatzstrategie","confidence","warnings","generated_at"
                    ]
                ],
            },
            "options": {},
        },
        "credentials": GS_CRED,
    },
    # 8. Google Sheets: LEADS ready_for_concept Flag setzen
    {
        "id": uid(), "name": "LEADS: Status setzen",
        "type": "n8n-nodes-base.googleSheets",
        "position": [-800, -928],
        "parameters": {
            "authentication": "serviceAccount",
            "resource":    "sheet",
            "operation":   "appendOrUpdate",
            "documentId":  {"__rl": True, "value": SHEETS_DOC_ID, "mode": "id"},
            "sheetName":   {"__rl": True, "mode": "name", "value": "LEADS"},
            "columns": {
                "mappingMode": "defineBelow",
                "matchingColumns": ["lead_id"],
                "value": {
                    "lead_id":           "={{ $json.lead_id }}",
                    "ready_for_concept": "={{ $json.ready_for_concept }}",
                    "data_quality_score":"={{ $json.data_quality_score }}",
                },
                "schema": [
                    {"id": k, "displayName": k, "required": False, "defaultMatch": False,
                     "display": True, "type": "string", "canBeUsedToMatch": True}
                    for k in ["lead_id","ready_for_concept","data_quality_score"]
                ],
            },
            "options": {},
        },
        "credentials": GS_CRED,
        "continueOnFail": True,
    },
]

# ---- Connections ----
# Node-Namen → IDs für Connections
node_ids = {n["name"]: n["id"] for n in NODES}

def conn(from_name, to_name, out_idx=0):
    return (from_name, out_idx, to_name)

RAW_CONNECTIONS = [
    conn("Start Agent 4",           "Suchparameter"),
    conn("Suchparameter",           "LEADS holen"),
    conn("LEADS holen",             "Map & Filter Leads"),
    conn("Map & Filter Leads",      "Loop je Lead"),
    # Loop: output[0]=done, output[1]=process items
    ("Loop je Lead",       1, "Validierung"),
    conn("Validierung",             "Gate & Write"),
    conn("Gate & Write",            "Sheet: Validation schreiben"),
    conn("Sheet: Validation schreiben", "LEADS: Status setzen"),
    conn("LEADS: Status setzen",    "Loop je Lead"),  # loop back
]

CONNECTIONS = {}
for item in RAW_CONNECTIONS:
    from_name, out_idx, to_name = item
    if from_name not in CONNECTIONS:
        CONNECTIONS[from_name] = {"main": [[], []]}
    while len(CONNECTIONS[from_name]["main"]) <= out_idx:
        CONNECTIONS[from_name]["main"].append([])
    CONNECTIONS[from_name]["main"][out_idx].append(
        {"node": to_name, "type": "main", "index": 0}
    )


def create_workflow():
    payload = {
        "name":        "MONEYLAN Agent 4 — Data Validator",
        "nodes":       NODES,
        "connections": CONNECTIONS,
        "settings":    {"executionOrder": "v1"},
        "staticData":  None,
    }
    r = requests.post(f"{BASE_URL}/api/v1/workflows", headers=HEADERS, json=payload)
    if not r.ok:
        print(f"FEHLER {r.status_code}: {r.text[:800]}")
        sys.exit(1)
    wf = r.json()
    print(f"✓ Workflow erstellt: {wf['id']} — {wf['name']}")
    return wf


def save_local(wf):
    out = HERE / "workflow_agent4.json"
    out.write_text(json.dumps(wf, indent=2, ensure_ascii=False))
    print(f"✓ Lokal gespeichert: {out}")


if __name__ == "__main__":
    print("=== MONEYLAN Agent 4 — Build & Deploy (Neu) ===")
    print(f"  {len(NODES)} Nodes, {len(RAW_CONNECTIONS)} Connections")
    wf = create_workflow()
    save_local(wf)
    print(f"\n✓ Workflow ID: {wf['id']}, aktiv: {wf.get('active')}")
    print("\nAgent 4 Regelwerk:")
    print("  ✓ 10 Vollständigkeits-Checks (5a)")
    print("  ✓ 3 Konsistenz-Checks Cross-Source (5b)")
    print("  ✓ 4 Validitäts-Checks (5c)")
    print("  ✓ Build-Risiko (6 Faktoren)")
    print("  ✓ Gate-Logik: blocker | score<70 | risk_high → ready=false")
    print("  ✓ rückgabe_an[] (agent1/2/3) bei false")
    print("  ✓ Ersatzstrategie-Katalog (kein Hero, kein Logo, ...)")
    print("  ✓ validation.json + VALIDATION-Sheet")
