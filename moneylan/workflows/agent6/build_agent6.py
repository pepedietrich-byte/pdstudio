#!/usr/bin/env python3
"""
MONEYLAN Agent 6 — Build & Deploy (von Null)
Erstellt den Claude Code Prompt Builder via n8n public REST API.
"""

import json, os, sys, uuid, requests
from pathlib import Path

BASE_URL = os.environ["N8N_BASE_URL"].rstrip("/")
API_KEY  = os.environ["N8N_API_KEY"]
HEADERS  = {"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"}

HERE    = Path(__file__).parent
ASSEMBLE = (HERE / "code_nodes/assemble_prompt.js").read_text()

GS_CRED       = {"googleApi": {"id": "EsWUzcrYxH8tX93F", "name": "Google Service Account account"}}
SHEETS_DOC_ID = "1Fjw6K4MY-H3KfsM4CrZ9BAbDQ0cOKosqAGVsqqftpjc"

def uid(): return str(uuid.uuid4())

NODES = [
    # 0. Trigger
    {"id":uid(),"name":"Start Agent 6","type":"n8n-nodes-base.manualTrigger",
     "position":[-2400,-928],"parameters":{}},

    # 1. CONCEPT-Sheet lesen
    {"id":uid(),"name":"CONCEPT holen","type":"n8n-nodes-base.googleSheets",
     "position":[-2200,-928],
     "parameters":{
         "authentication":"serviceAccount","resource":"sheet","operation":"read",
         "documentId":{"__rl":True,"value":SHEETS_DOC_ID,"mode":"id"},
         "sheetName":{"__rl":True,"mode":"name","value":"CONCEPT"},
         "options":{},
     },"credentials":GS_CRED},

    # 2. Filter: hat lead_id (concept vorhanden)
    {"id":uid(),"name":"Filter: hat Konzept","type":"n8n-nodes-base.code",
     "position":[-2000,-928],
     "parameters":{
         "mode":"runOnceForAllItems",
         "jsCode": r"""
return $input.all().filter(it => !!it.json.lead_id);
""",
     }},

    # 3. Loop je Lead
    {"id":uid(),"name":"Loop je Lead","type":"n8n-nodes-base.splitInBatches",
     "position":[-1800,-928],"parameters":{"batchSize":1,"options":{}}},

    # 4. Code: Quellen laden + Prompt assemblieren + Dateien schreiben
    {"id":uid(),"name":"Prompt assemblieren","type":"n8n-nodes-base.code",
     "position":[-1600,-928],
     "parameters":{"mode":"runOnceForEachItem","jsCode": ASSEMBLE},
     "continueOnFail":True},

    # 5. Filter: nicht übersprungene Leads
    {"id":uid(),"name":"Filter: nicht übersprungen","type":"n8n-nodes-base.filter",
     "position":[-1400,-928],
     "parameters":{
         "conditions":{
             "options":{"caseSensitive":True,"leftValue":"","typeValidation":"strict","version":2},
             "conditions":[{
                 "id":uid(),"leftValue":"={{ $json.skipped }}",
                 "rightValue":True,"operator":{"type":"boolean","operation":"notEquals"}
             }]
         }
     }},

    # 6. Google Sheets: BUILD upsert
    {"id":uid(),"name":"Sheet: Build schreiben","type":"n8n-nodes-base.googleSheets",
     "position":[-1200,-928],
     "parameters":{
         "authentication":"serviceAccount","resource":"sheet","operation":"appendOrUpdate",
         "documentId":{"__rl":True,"value":SHEETS_DOC_ID,"mode":"id"},
         "sheetName":{"__rl":True,"mode":"name","value":"BUILD"},
         "columns":{
             "mappingMode":"defineBelow",
             "matchingColumns":["lead_id"],
             "value":{
                 "lead_id":             "={{ $json.lead_id }}",
                 "tech_stack":          "={{ $json.tech_stack?.framework }} + {{ $json.tech_stack?.styling }}",
                 "sections_count":      "={{ ($json.sections_spec||[]).length }}",
                 "asset_count":         "={{ ($json.asset_paths||[]).length }}",
                 "do_not_invent_count": "={{ ($json.do_not_invent||[]).length }}",
                 "do_not_invent":       "={{ ($json.do_not_invent||[]).join(', ') }}",
                 "noindex":             "={{ $json.noindex_required }}",
                 "demo_notice":         "={{ $json.demo_notice?.required }}",
                 "prompt_chars":        "={{ ($json.build_prompt||'').length }}",
                 "prompt_path":         "={{ '/files/runs/' + $json.lead_id + '/CLAUDE_BUILD_PROMPT.md' }}",
                 "confidence":          "={{ $json.confidence }}",
                 "warnings":            "={{ ($json.warnings||[]).join(', ') }}",
                 "generated_at":        "={{ $json.generated_at }}",
             },
             "schema":[
                 {"id":k,"displayName":k,"required":False,"defaultMatch":False,
                  "display":True,"type":"string","canBeUsedToMatch":True}
                 for k in ["lead_id","tech_stack","sections_count","asset_count",
                           "do_not_invent_count","do_not_invent","noindex","demo_notice",
                           "prompt_chars","prompt_path","confidence","warnings","generated_at"]
             ],
         },"options":{},
     },"credentials":GS_CRED,"continueOnFail":True},

    # 7. Set: Zusammenfassung
    {"id":uid(),"name":"Pipeline-Zusammenfassung","type":"n8n-nodes-base.set",
     "position":[-1000,-928],
     "parameters":{
         "assignments":{"assignments":[
             {"id":uid(),"name":"lead_id",     "value":"={{ $json.lead_id }}",     "type":"string"},
             {"id":uid(),"name":"prompt_path", "value":"={{ '/files/runs/' + $json.lead_id + '/CLAUDE_BUILD_PROMPT.md' }}","type":"string"},
             {"id":uid(),"name":"confidence",  "value":"={{ $json.confidence }}",  "type":"number"},
             {"id":uid(),"name":"warnings",    "value":"={{ $json.warnings }}",    "type":"array"},
             {"id":uid(),"name":"ready_to_build","value":True,"type":"boolean"},
         ]}
     }},
]

# ---- Connections ----
RAW_CONNECTIONS = [
    ("Start Agent 6",           0, "CONCEPT holen"),
    ("CONCEPT holen",           0, "Filter: hat Konzept"),
    ("Filter: hat Konzept",     0, "Loop je Lead"),
    ("Loop je Lead",            1, "Prompt assemblieren"),      # output[1] = body
    ("Prompt assemblieren",     0, "Filter: nicht übersprungen"),
    ("Filter: nicht übersprungen", 0, "Sheet: Build schreiben"),
    ("Sheet: Build schreiben",  0, "Pipeline-Zusammenfassung"),
    ("Pipeline-Zusammenfassung",0, "Loop je Lead"),             # loop back
]

CONNECTIONS = {}
for from_name, out_idx, to_name in RAW_CONNECTIONS:
    if from_name not in CONNECTIONS:
        CONNECTIONS[from_name] = {"main":[[] for _ in range(out_idx+1)]}
    while len(CONNECTIONS[from_name]["main"]) <= out_idx:
        CONNECTIONS[from_name]["main"].append([])
    CONNECTIONS[from_name]["main"][out_idx].append(
        {"node":to_name,"type":"main","index":0})


def create_workflow():
    payload = {
        "name":        "MONEYLAN Agent 6 — Claude Code Prompt Builder",
        "nodes":       NODES,
        "connections": CONNECTIONS,
        "settings":    {"executionOrder":"v1"},
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
    out = HERE / "workflow_agent6.json"
    out.write_text(json.dumps(wf, indent=2, ensure_ascii=False))
    print(f"✓ Lokal gespeichert: {out}")


if __name__ == "__main__":
    print("=== MONEYLAN Agent 6 — Build & Deploy (Neu) ===")
    print(f"  {len(NODES)} Nodes, {len(RAW_CONNECTIONS)} Connections")
    wf = create_workflow()
    save_local(wf)
    print(f"\n✓ Workflow ID: {wf['id']}, aktiv: {wf.get('active')}")
    print("\nAgent 6 Features:")
    print("  ✓ 100% deterministisch — kein LLM-Risk beim finalen Prompt")
    print("  ✓ CLAUDE_BUILD_PROMPT.md (vollständige Struktur nach Masterplan Abschnitt 5)")
    print("  ✓ CSS Custom Properties direkt aus Design-Tokens")
    print("  ✓ do_not_invent mehrfach platziert (global + pro Sektion + Checkliste)")
    print("  ✓ noindex + Demo-Notice Pflicht-Constraints")
    print("  ✓ Qualitäts-Checkliste + Post-Build-Tests (Lighthouse ≥90 NORMAL-Skala)")
    print("  ✓ claude_prompt.json maschinenlesbar")
    print("  ✓ BUILD-Sheet + beide Dateien in /files/runs/{lead_id}/")
