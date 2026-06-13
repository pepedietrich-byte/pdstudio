#!/usr/bin/env python3
"""
MONEYLAN Agent 2 — Build & Deploy
Fixiert Credential-Bugs, aktualisiert auf Schema v2.0, deployt via n8n REST API.
"""

import json, os, sys, requests
from pathlib import Path

BASE_URL = os.environ["N8N_BASE_URL"].rstrip("/")
API_KEY  = os.environ["N8N_API_KEY"]
HEADERS  = {"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"}
WF_ID    = "04XC92MJvaYKtjbi"

HERE = Path(__file__).parent
MERGE_V2 = (HERE / "code_nodes/merge_manifest_v2.js").read_text()

OXY_CRED = {"httpBasicAuth": {"id": "DVF4iIIeEDvqPjs9", "name": "OXY"}}
POE_CRED = {"httpHeaderAuth": {"id": "UJ5khOPRpBDsxk6m", "name": "Header Auth account"}}
GS_CRED  = {"googleApi": {"id": "EsWUzcrYxH8tX93F", "name": "Google Service Account account"}}

SHEETS_DOC_ID = "1Fjw6K4MY-H3KfsM4CrZ9BAbDQ0cOKosqAGVsqqftpjc"

# Aktualisierter LLM System-Prompt (Schema v2.0)
LLM_SYSTEM_PROMPT = (
    "Du bist ein präziser Daten-Extraktor für Website-Texte lokaler Restaurants/Cafés/KMU. "
    "Du bekommst Roh-Material (JSON-LD-Fakten, Meta-Tags, Überschriften, sichtbarer Fließtext). "
    "Aufgabe: Inhalte in sauberes JSON überführen, das als Grundlage einer neuen Website dient. "
    "Antworte AUSSCHLIESSLICH mit einem gültigen JSON-Objekt, ohne Markdown, ohne Backticks, ohne Vor-/Nachtext. "
    "Erfinde KEINE Fakten: was nicht im Material steht, bleibt leer (\\\"\\\" oder []). "
    "Unter 'fakten' NUR was eindeutig im Text steht (nicht umformulieren). "
    "Unter 'interpretation' darfst du formulieren und ableiten. "
    "Schema (genau diese Schlüssel):\\n"
    "{\\n"
    "  \\\"fakten\\\": {\\n"
    "    \\\"name\\\": \\\"\\\", \\\"adresse\\\": \\\"\\\", \\\"telefon\\\": \\\"\\\", \\\"email\\\": \\\"\\\",\\n"
    "    \\\"oeffnungszeiten\\\": \\\"\\\", \\\"speisekarte\\\": [], \\\"preise_erkannt\\\": false,\\n"
    "    \\\"reservierung_url\\\": null, \\\"lieferdienste\\\": [], \\\"socials\\\": []\\n"
    "  },\\n"
    "  \\\"interpretation\\\": {\\n"
    "    \\\"claim_slogan\\\": \\\"\\\", \\\"ueber_uns\\\": \\\"\\\", \\\"angebot\\\": [],\\n"
    "    \\\"spezialitaeten\\\": [], \\\"kueche\\\": [], \\\"events\\\": [], \\\"catering\\\": null,\\n"
    "    \\\"atmosphaere\\\": \\\"\\\", \\\"zielgruppe\\\": \\\"\\\", \\\"positionierung\\\": \\\"\\\",\\n"
    "    \\\"tonalitaet\\\": {\\\"ton\\\": [], \\\"beschreibung\\\": \\\"\\\"}\\n"
    "  }\\n"
    "}"
)


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
    nodes = wf["nodes"]

    # ------------------------------------------------------------------ #
    # 1. Oxylabs Startseite: Custom Auth → OXY Basic Auth (BUG FIX)      #
    # ------------------------------------------------------------------ #
    oxy_start = node_by_name(nodes, "Oxylabs: Startseite holen1")
    oxy_start["parameters"]["authentication"]  = "genericCredentialType"
    oxy_start["parameters"]["genericAuthType"] = "httpBasicAuth"
    oxy_start["credentials"] = OXY_CRED
    oxy_start["continueOnFail"] = True

    # ------------------------------------------------------------------ #
    # 2. Oxylabs Unterseiten: leere Creds → OXY Basic Auth (BUG FIX)     #
    # ------------------------------------------------------------------ #
    oxy_sub = node_by_name(nodes, "Oxylabs: Seite scrapen")
    oxy_sub["parameters"]["authentication"]  = "genericCredentialType"
    oxy_sub["parameters"]["genericAuthType"] = "httpBasicAuth"
    oxy_sub["credentials"] = OXY_CRED

    # ------------------------------------------------------------------ #
    # 3. Oxylabs: Timeouts setzen (falls fehlen)                          #
    # ------------------------------------------------------------------ #
    for node_name in ["Oxylabs: Startseite holen1", "Oxylabs: Seite scrapen"]:
        node = node_by_name(nodes, node_name)
        if node:
            opts = node["parameters"].setdefault("options", {})
            opts.setdefault("response", {"response": {"neverError": True, "responseFormat": "json"}})
            opts.setdefault("timeout", 45000)

    # ------------------------------------------------------------------ #
    # 4. LLM-Prompt: System-Content auf Schema v2.0 aktualisieren        #
    # ------------------------------------------------------------------ #
    llm_node = node_by_name(nodes, "LLM: Strukturieren (Poe Sonnet)1")
    llm_node["parameters"]["jsonBody"] = (
        "={{ JSON.stringify({\n"
        "  model: 'Claude-Sonnet-4.6',\n"
        "  temperature: 0,\n"
        "  max_tokens: 2000,\n"
        "  messages: [\n"
        "    { role: 'system', content: " + json.dumps(LLM_SYSTEM_PROMPT) + " },\n"
        "    { role: 'user', content: 'Roh-Material:\\n' + $json.raw_material }\n"
        "  ]\n"
        "}) }}"
    )
    llm_node["parameters"]["options"] = {
        "response": {"response": {"neverError": True, "responseFormat": "json"}},
        "timeout": 90000
    }
    llm_node["continueOnFail"] = True

    # ------------------------------------------------------------------ #
    # 5. Merge & Manifest: Code auf v2.0 + file write ersetzen           #
    # ------------------------------------------------------------------ #
    merge = node_by_name(nodes, "Merge & Manifest1")
    merge["parameters"]["jsCode"] = MERGE_V2
    merge["continueOnFail"] = True

    # ------------------------------------------------------------------ #
    # 6. Sheet Content: Spalten auf v2.0 aktualisieren                   #
    # ------------------------------------------------------------------ #
    sheet_content = node_by_name(nodes, "Sheet: Content schreiben1")
    sheet_content["parameters"]["columns"]["value"] = {
        "lead_id":        "={{ $json.lead_id }}",
        "name":           "={{ $json.fakten?.name }}",
        "claim_slogan":   "={{ $json.interpretation?.claim_slogan }}",
        "ueber_uns":      "={{ $json.interpretation?.ueber_uns }}",
        "angebot":        "={{ ($json.interpretation?.angebot || []).join(' | ') }}",
        "speisekarte":    "={{ ($json.fakten?.speisekarte || []).map(s => typeof s === 'string' ? s : s.name || JSON.stringify(s)).join(' | ') }}",
        "spezialitaeten": "={{ ($json.interpretation?.spezialitaeten || []).join(' | ') }}",
        "kueche":         "={{ ($json.interpretation?.kueche || []).join(' | ') }}",
        "adresse":        "={{ $json.fakten?.adresse }}",
        "oeffnungszeiten":"={{ $json.fakten?.oeffnungszeiten }}",
        "telefon":        "={{ $json.fakten?.telefon }}",
        "email":          "={{ $json.fakten?.email }}",
        "socials":        "={{ ($json.fakten?.socials || []).map(s => s.url).join(' | ') }}",
        "atmosphaere":    "={{ $json.interpretation?.atmosphaere }}",
        "zielgruppe":     "={{ $json.interpretation?.zielgruppe }}",
        "ton":            "={{ ($json.interpretation?.tonalitaet?.ton || []).join(', ') }}",
        "ton_beschreibung": "={{ $json.interpretation?.tonalitaet?.beschreibung }}",
        "missing_fields": "={{ ($json.missing_fields || []).join(', ') }}",
        "confidence":     "={{ $json.confidence }}",
        "warnings":       "={{ ($json.warnings || []).join(', ') }}",
        "roh_text":       "={{ ($json.roh_reserve || '').slice(0, 1000) }}",
        "generated_at":   "={{ $json.generated_at }}",
    }
    sheet_content["parameters"]["columns"]["schema"] = [
        {"id": k, "displayName": k, "required": False, "defaultMatch": False,
         "display": True, "type": "string", "canBeUsedToMatch": True}
        for k in sheet_content["parameters"]["columns"]["value"].keys()
    ]

    # ------------------------------------------------------------------ #
    # 7. Sheet E-Mail nachtragen: confidence ergänzen                     #
    # ------------------------------------------------------------------ #
    email_sheet = node_by_name(nodes, "Sheet: E-Mail nachtragen1")
    email_sheet["parameters"]["columns"]["value"]["email"] = "={{ $json.fakten?.email }}"
    email_sheet["parameters"]["columns"]["value"]["confidence"] = "={{ $json.confidence }}"

    # ------------------------------------------------------------------ #
    # 8. Google Sheets LEADS Read: sicherstellen Sheet-Name stimmt        #
    # ------------------------------------------------------------------ #
    gs_read = node_by_name(nodes, "Get row(s) in sheet1")
    # Sicherstellen dass Credentials korrekt
    gs_read["credentials"] = GS_CRED

    wf["nodes"] = nodes
    return wf


def deploy(wf):
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
    out = HERE / "workflow_agent2.json"
    out.write_text(json.dumps(wf, indent=2, ensure_ascii=False))
    print(f"✓ Lokal gespeichert: {out}")


if __name__ == "__main__":
    print("=== MONEYLAN Agent 2 — Build & Deploy ===")
    wf = fetch_workflow()
    print(f"  Workflow geladen: {wf['name']} ({len(wf['nodes'])} Nodes)")
    wf = patch_workflow(wf)
    result = deploy(wf)
    save_local(wf)
    print(f"\n✓ Fertig! Workflow ID: {result['id']}, aktiv: {result.get('active')}")
    print("\nGefixte Bugs:")
    print("  ✓ Oxylabs Startseite: Custom Auth → OXY Basic Auth")
    print("  ✓ Oxylabs Unterseiten: leer → OXY Basic Auth")
    print("  ✓ LLM-Prompt: Schema v1.0 → v2.0 (fakten/interpretation)")
    print("  ✓ Merge & Manifest: Schema v2.0 + missing_fields + confidence + file write")
    print("  ✓ Sheet Content: Spalten auf v2.0 aktualisiert")
