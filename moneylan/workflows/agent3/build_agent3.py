#!/usr/bin/env python3
"""
MONEYLAN Agent 3 — Build & Deploy
Fixiert Credential-Bugs, upgrades auf Schema v2.0 mit echtem Asset-Download.
"""

import json, os, sys, requests
from pathlib import Path

BASE_URL = os.environ["N8N_BASE_URL"].rstrip("/")
API_KEY  = os.environ["N8N_API_KEY"]
HEADERS  = {"X-N8N-API-KEY": API_KEY, "Content-Type": "application/json"}
WF_ID    = "peVGxOTGY1v2D12B"

HERE      = Path(__file__).parent
MERGE_V2  = (HERE / "code_nodes/merge_manifest_v2.js").read_text()

OXY_CRED = {"httpBasicAuth": {"id": "DVF4iIIeEDvqPjs9", "name": "OXY"}}
GS_CRED  = {"googleApi": {"id": "EsWUzcrYxH8tX93F", "name": "Google Service Account account"}}
SHEETS_DOC_ID = "1Fjw6K4MY-H3KfsM4CrZ9BAbDQ0cOKosqAGVsqqftpjc"


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
    # 1. Oxylabs Startseite: Custom Auth → OXY Basic Auth                 #
    # ------------------------------------------------------------------ #
    oxy_start = node_by_name(nodes, "Oxylabs: Startseite holen")
    oxy_start["parameters"]["authentication"]  = "genericCredentialType"
    oxy_start["parameters"]["genericAuthType"] = "httpBasicAuth"
    oxy_start["credentials"] = OXY_CRED
    oxy_start["continueOnFail"] = True
    oxy_start["parameters"].setdefault("options", {}).update({
        "response": {"response": {"neverError": True, "responseFormat": "json"}},
        "timeout": 45000
    })

    # ------------------------------------------------------------------ #
    # 2. Oxylabs Seite scrapen: Custom Auth → OXY Basic Auth             #
    # ------------------------------------------------------------------ #
    oxy_sub = node_by_name(nodes, "Oxylabs: Seite scrapen")
    oxy_sub["parameters"]["authentication"]  = "genericCredentialType"
    oxy_sub["parameters"]["genericAuthType"] = "httpBasicAuth"
    oxy_sub["credentials"] = OXY_CRED
    oxy_sub["continueOnFail"] = True
    oxy_sub["parameters"].setdefault("options", {}).update({
        "response": {"response": {"neverError": True, "responseFormat": "json"}},
        "timeout": 45000
    })

    # ------------------------------------------------------------------ #
    # 3. Bild laden: Custom Auth entfernen → anonym + Referer-Header      #
    # ------------------------------------------------------------------ #
    bild = node_by_name(nodes, "Bild laden")
    # Keine Authentifizierung nötig für öffentliche Bild-URLs
    bild["parameters"].pop("authentication", None)
    bild["parameters"].pop("genericAuthType", None)
    # Referer-Header hinzufügen (gegen Hotlink-Schutz)
    bild["parameters"]["sendHeaders"] = True
    bild["parameters"]["headerParameters"] = {
        "parameters": [
            {
                "name": "Referer",
                "value": "={{ $json.source_url || $('Bild-Kandidaten').first().json.final_url || '' }}"
            }
        ]
    }
    bild["credentials"] = {}  # keine Credentials
    bild["continueOnFail"] = True
    bild["parameters"]["options"] = {
        "response": {"response": {"responseFormat": "file", "neverError": True}},
        "timeout": 30000
    }

    # ------------------------------------------------------------------ #
    # 4. Merge & Manifest: Code auf v2.0 aktualisieren                   #
    # ------------------------------------------------------------------ #
    merge = node_by_name(nodes, "Merge & Manifest")
    merge["parameters"]["jsCode"] = MERGE_V2
    merge["continueOnFail"] = True

    # ------------------------------------------------------------------ #
    # 5. Sheet: Images schreiben — Spalten auf v2.0                      #
    # ------------------------------------------------------------------ #
    sheet = node_by_name(nodes, "Sheet: Images schreiben")
    sheet["parameters"]["columns"]["value"] = {
        "lead_id":              "={{ $json.lead_id }}",
        "name":                 "={{ $('Loop je Lead').first()?.json?.business?.name || '' }}",
        "logo_url":             "={{ $json.logo?.url }}",
        "logo_local_path":      "={{ $json.logo?.local_path }}",
        "logo_qualitaet":       "={{ $json.logo?.qualitaet }}",
        "hero_url":             "={{ $json.hero?.url }}",
        "hero_local_path":      "={{ $json.hero?.local_path }}",
        "galerie_urls":         "={{ ($json.assets || []).filter(a=>a.usage_recommendation==='verwenden'&&a.url!==$json.logo?.url&&a.url!==$json.hero?.url).map(a=>a.url).join(' | ') }}",
        "galerie_local_paths":  "={{ ($json.assets || []).filter(a=>a.local_path&&a.usage_recommendation==='verwenden'&&a.url!==$json.logo?.url&&a.url!==$json.hero?.url).map(a=>a.local_path).join(' | ') }}",
        "farbpalette":          "={{ ($json.farbpalette || []).join(', ') }}",
        "bild_stil":            "={{ $json.bild_stil }}",
        "anzahl_gesamt":        "={{ $json.stats?.kandidaten_gesamt }}",
        "anzahl_verwendbar":    "={{ $json.stats?.verwendbar }}",
        "anzahl_gespeichert":   "={{ $json.stats?.gespeichert }}",
        "konzept_text":         "={{ $json.konzept_text }}",
        "empfehlung_agent5":    "={{ $json.empfehlung_agent5 }}",
        "fehlende_assets":      "={{ ($json.fehlende_assets || []).join(', ') }}",
        "confidence":           "={{ $json.confidence }}",
        "warnings":             "={{ ($json.warnings || []).join(', ') }}",
        "generated_at":         "={{ $json.generated_at }}",
    }
    sheet["parameters"]["columns"]["schema"] = [
        {"id": k, "displayName": k, "required": False, "defaultMatch": False,
         "display": True, "type": "string", "canBeUsedToMatch": True}
        for k in sheet["parameters"]["columns"]["value"].keys()
    ]

    # ------------------------------------------------------------------ #
    # 6. Loop done-output verbinden (falls fehlt)                         #
    # ------------------------------------------------------------------ #
    # Loop output[0] = done, output[1] = loop body
    # Sicherstellen dass Loop je Lead auch output[0] hat (Workflow-Ende)
    conns = wf["connections"]
    loop_conns = conns.get("Loop je Lead", {}).get("main", [[], []])
    if len(loop_conns) < 2:
        loop_conns = [[], [{"node": "Oxylabs: Startseite holen", "type": "main", "index": 0}]]
    elif not loop_conns[1]:
        loop_conns[1] = [{"node": "Oxylabs: Startseite holen", "type": "main", "index": 0}]
    conns["Loop je Lead"] = {"main": loop_conns}

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
    out = HERE / "workflow_agent3.json"
    out.write_text(json.dumps(wf, indent=2, ensure_ascii=False))
    print(f"✓ Lokal gespeichert: {out}")


if __name__ == "__main__":
    print("=== MONEYLAN Agent 3 — Build & Deploy ===")
    wf = fetch_workflow()
    print(f"  Workflow geladen: {wf['name']} ({len(wf['nodes'])} Nodes)")
    wf = patch_workflow(wf)
    result = deploy(wf)
    save_local(wf)
    print(f"\n✓ Fertig! Workflow ID: {result['id']}, aktiv: {result.get('active')}")
    print("\nÄnderungen:")
    print("  ✓ Oxylabs Startseite: Custom Auth → OXY Basic Auth")
    print("  ✓ Oxylabs Unterseiten: Custom Auth → OXY Basic Auth")
    print("  ✓ Bild laden: Custom Auth entfernt, anonym + Referer-Header")
    print("  ✓ Merge & Manifest: Schema v2.0 + Asset-Download + fehlende_assets + stats + confidence")
    print("  ✓ Sheet IMAGES: Spalten auf v2.0 (20 Spalten)")
    print("  ✓ File write: /files/runs/{lead_id}/assets/ + images.json")
