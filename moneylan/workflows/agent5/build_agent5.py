#!/usr/bin/env python3
"""
MONEYLAN Agent 5 — Build & Deploy (von Null)
Erstellt den Concept Architect Workflow via n8n public REST API.
"""

import json, os, sys, uuid, requests
from pathlib import Path

BASE_URL = os.environ["N8N_BASE_URL"].rstrip("/")
API_KEY  = os.environ["N8N_API_KEY"]
HEADERS  = {"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"}

HERE            = Path(__file__).parent
LOAD_AND_DIRECT = (HERE / "code_nodes/load_and_direct.js").read_text()
VALIDATE_FIN    = (HERE / "code_nodes/validate_finalize.js").read_text()

GS_CRED       = {"googleApi": {"id": "EsWUzcrYxH8tX93F", "name": "Google Service Account account"}}
POE_CRED      = {"httpHeaderAuth": {"id": "UJ5khOPRpBDsxk6m", "name": "Header Auth account"}}
SHEETS_DOC_ID = "1Fjw6K4MY-H3KfsM4CrZ9BAbDQ0cOKosqAGVsqqftpjc"

def uid(): return str(uuid.uuid4())

NODES = [
    # 0. Trigger
    {"id":uid(),"name":"Start Agent 5","type":"n8n-nodes-base.manualTrigger",
     "position":[-2400,-928],"parameters":{}},

    # 1. VALIDATION-Sheet lesen (ready_for_concept=true)
    {"id":uid(),"name":"VALIDATION holen","type":"n8n-nodes-base.googleSheets",
     "position":[-2200,-928],
     "parameters":{
         "authentication":"serviceAccount","resource":"sheet","operation":"read",
         "documentId":{"__rl":True,"value":SHEETS_DOC_ID,"mode":"id"},
         "sheetName":{"__rl":True,"mode":"name","value":"VALIDATION"},
         "options":{},
     },"credentials":GS_CRED},

    # 2. Filter: nur ready_for_concept=true
    {"id":uid(),"name":"Filter: ready=true","type":"n8n-nodes-base.code",
     "position":[-2000,-928],
     "parameters":{
         "mode":"runOnceForAllItems",
         "jsCode":r"""
return $input.all().filter(it => {
  const v = String(it.json.ready_for_concept || '').toLowerCase();
  return v === 'true' || v === '1';
});
""",
     }},

    # 3. Loop je Lead
    {"id":uid(),"name":"Loop je Lead","type":"n8n-nodes-base.splitInBatches",
     "position":[-1800,-928],"parameters":{"batchSize":1,"options":{}}},

    # 4. Code: Quellen laden + Direction + LLM-Payload
    {"id":uid(),"name":"Konzept-Prompt","type":"n8n-nodes-base.code",
     "position":[-1600,-928],
     "parameters":{"mode":"runOnceForEachItem","jsCode":LOAD_AND_DIRECT},
     "continueOnFail":True},

    # 5. HTTP: Poe LLM (großer Konzept-Call)
    {"id":uid(),"name":"LLM: Konzept (Poe Sonnet)","type":"n8n-nodes-base.httpRequest",
     "position":[-1400,-928],
     "parameters":{
         "method":"POST","url":"https://api.poe.com/v1/chat/completions",
         "authentication":"genericCredentialType","genericAuthType":"httpHeaderAuth",
         "sendBody":True,"specifyBody":"json",
         "jsonBody":"={{ $json.llm_payload }}",
         "options":{
             "response":{"response":{"neverError":True,"responseFormat":"json"}},
             "timeout":120000,
         }
     },"credentials":POE_CRED,"continueOnFail":True},

    # 6. Code: Validate + Finalize + Write concept.json
    {"id":uid(),"name":"Finalize & Schreiben","type":"n8n-nodes-base.code",
     "position":[-1200,-928],
     "parameters":{"mode":"runOnceForEachItem","jsCode":VALIDATE_FIN},
     "continueOnFail":True},

    # 7. Google Sheets: CONCEPT upsert
    {"id":uid(),"name":"Sheet: Concept schreiben","type":"n8n-nodes-base.googleSheets",
     "position":[-1000,-928],
     "parameters":{
         "authentication":"serviceAccount","resource":"sheet","operation":"appendOrUpdate",
         "documentId":{"__rl":True,"value":SHEETS_DOC_ID,"mode":"id"},
         "sheetName":{"__rl":True,"mode":"name","value":"CONCEPT"},
         "columns":{
             "mappingMode":"defineBelow",
             "matchingColumns":["lead_id"],
             "value":{
                 "lead_id":               "={{ $json.lead_id }}",
                 "design_direction":      "={{ $json.positionierung?.design_direction }}",
                 "design_direction_begruendung": "={{ $json.positionierung?.design_direction_begruendung }}",
                 "branche_typ":           "={{ $json.positionierung?.branche_typ }}",
                 "zielgruppe":            "={{ $json.positionierung?.zielgruppe }}",
                 "stimmung":              "={{ ($json.positionierung?.stimmung||[]).join(', ') }}",
                 "colors":                "={{ JSON.stringify($json.design_tokens?.colors||{}) }}",
                 "typography":            "={{ JSON.stringify($json.design_tokens?.typography||{}) }}",
                 "sections":              "={{ JSON.stringify(($json.sections||[]).map(s=>s.id)) }}",
                 "hero_headline":         "={{ $json.copy?.hero_headline }}",
                 "cta_primary":           "={{ $json.copy?.cta_primary }}",
                 "ueber_uns_neu":         "={{ ($json.copy?.ueber_uns_neu||'').slice(0,500) }}",
                 "improvements":          "={{ ($json.improvements_vs_original||[]).join(' | ') }}",
                 "do_not_invent":         "={{ ($json.constraints?.do_not_invent||[]).join(', ') }}",
                 "confidence":            "={{ $json.confidence }}",
                 "warnings":              "={{ ($json.warnings||[]).join(', ') }}",
                 "generated_at":          "={{ $json.generated_at }}",
             },
             "schema":[
                 {"id":k,"displayName":k,"required":False,"defaultMatch":False,
                  "display":True,"type":"string","canBeUsedToMatch":True}
                 for k in ["lead_id","design_direction","design_direction_begruendung","branche_typ",
                           "zielgruppe","stimmung","colors","typography","sections","hero_headline",
                           "cta_primary","ueber_uns_neu","improvements","do_not_invent",
                           "confidence","warnings","generated_at"]
             ],
         },"options":{},
     },"credentials":GS_CRED,"continueOnFail":True},
]

# ---- Connections ----
RAW_CONNECTIONS = [
    ("Start Agent 5",           0, "VALIDATION holen"),
    ("VALIDATION holen",        0, "Filter: ready=true"),
    ("Filter: ready=true",      0, "Loop je Lead"),
    ("Loop je Lead",            1, "Konzept-Prompt"),      # output[1] = loop body
    ("Konzept-Prompt",          0, "LLM: Konzept (Poe Sonnet)"),
    ("LLM: Konzept (Poe Sonnet)",0,"Finalize & Schreiben"),
    ("Finalize & Schreiben",    0, "Sheet: Concept schreiben"),
    ("Sheet: Concept schreiben",0, "Loop je Lead"),        # loop back
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
        "name":        "MONEYLAN Agent 5 — Concept Architect",
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
    out = HERE / "workflow_agent5.json"
    out.write_text(json.dumps(wf, indent=2, ensure_ascii=False))
    print(f"✓ Lokal gespeichert: {out}")


if __name__ == "__main__":
    print("=== MONEYLAN Agent 5 — Build & Deploy (Neu) ===")
    print(f"  {len(NODES)} Nodes, {len(RAW_CONNECTIONS)} Connections")
    wf = create_workflow()
    save_local(wf)
    print(f"\n✓ Workflow ID: {wf['id']}, aktiv: {wf.get('active')}")
    print("\nAgent 5 Features:")
    print("  ✓ 7 Design-Directions im Katalog (deterministisch vorausgewählt)")
    print("  ✓ A3-Farbpalette überschreibt Direction-Defaults")
    print("  ✓ WCAG-Kontrast-Check für Text/Background")
    print("  ✓ Claude Sonnet: Sektionen, Copy, Conversion-Logik, Verbesserungen")
    print("  ✓ Self-Correction + Fallback-Skelett")
    print("  ✓ do_not_invent aus missing_fields")
    print("  ✓ demo_notice_required + noindex_required Pflicht-Constraints")
    print("  ✓ concept.json + CONCEPT-Sheet")
