// Agent 7 — Node: "Files parsen"
// Parses JSON from LLM response and extracts file array
// Input: HTTP response from Poe API
// Output: 1 item with files array + lead data

const data     = $('Website-Prompt bauen').first().json;
const leadId   = data.lead_id;
const response = $input.first().json;

// Extract content from Poe/OpenAI-compatible response
const rawContent = response.choices?.[0]?.message?.content
  || response.content
  || response.message?.content
  || '';

let files = [];
let parseError = null;

// Try to extract JSON from response
const jsonMatches = rawContent.match(/\{[\s\S]*\}/g) || [];
for (const candidate of jsonMatches) {
  try {
    const parsed = JSON.parse(candidate);
    if (parsed.files && Array.isArray(parsed.files)) {
      files = parsed.files.filter(f => f.name && typeof f.content === 'string');
      break;
    }
  } catch(e) { continue; }
}

if (files.length === 0) {
  parseError = 'json_parse_failed';
  // Still try to write what we have for debugging
}

return [{json: {
  ...data,
  files,
  parse_error: parseError,
  raw_response_length: rawContent.length,
}}];


// ============================================================
// Agent 7 — Node: "Files schreiben"  (separate node code below)
// ============================================================
// const data   = $input.first().json;
// const leadId = data.lead_id;
// const files  = data.files || [];
// const fs     = require('fs');
//
// const siteDir = `/files/runs/${leadId}/site`;
// fs.mkdirSync(siteDir, { recursive: true });
//
// const written = [];
// for (const file of files) {
//   const fullPath = `${siteDir}/${file.name}`;
//   const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
//   if (dir !== siteDir) fs.mkdirSync(dir, { recursive: true });
//   fs.writeFileSync(fullPath, file.content, 'utf8');
//   written.push(file.name);
// }
//
// const filesForVercel = files.map(f => ({
//   file: f.name,
//   data: Buffer.from(f.content, 'utf8').toString('base64'),
//   encoding: 'base64',
// }));
//
// return [{json: {
//   ...data,
//   site_dir: siteDir,
//   files_written: written,
//   files_for_vercel: filesForVercel,
// }}];
