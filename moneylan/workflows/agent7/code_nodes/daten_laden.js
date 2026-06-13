// Agent 7 — Node: "Daten laden"
// runOnceForAllItems — reads lead data from /files JSON + LEADS sheet row
// Input: all LEADS sheet rows (from Google Sheets read)
// Output: 1 item with full lead data

const wh = $('Webhook: agent7').first();
const body = wh.json.body || wh.json;
const leadId = String(body.lead_id || '').trim();

if (!leadId) {
  return [{ json: { error: 'no_lead_id', skipped: true, lead_id: '' } }];
}

const leadsRows = $input.all().map(i => i.json);
const leadRow   = leadsRows.find(r => String(r.lead_id || '').trim() === leadId) || {};

const fs = require('fs');
let content = {}, images = {}, concept = {};

try { content = JSON.parse(fs.readFileSync(`/files/runs/${leadId}/content.json`,  'utf8')); } catch(e) {}
try { images  = JSON.parse(fs.readFileSync(`/files/runs/${leadId}/images.json`,   'utf8')); } catch(e) {}
try { concept = JSON.parse(fs.readFileSync(`/files/runs/${leadId}/concept.json`,  'utf8')); } catch(e) {}

// claude_prompt.json from A6 — authoritative source for design data
let promptData = {};
try { promptData = JSON.parse(fs.readFileSync(`/files/runs/${leadId}/claude_prompt.json`, 'utf8')); } catch(e) {}

const websiteUrl = leadRow.website || leadRow.url || '';

return [{json: {
  lead_id:     leadId,
  lead:        leadRow,
  content:     content,
  images:      images,
  concept:     concept,
  prompt_data: promptData,
  website_url: websiteUrl,
  has_files:   !!concept.lead_id,
}}];
