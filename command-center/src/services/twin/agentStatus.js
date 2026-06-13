const AGENT_NAMES = {
  1: 'Lead Scanner',
  2: 'Text Extractor',
  3: 'Image Extractor',
  4: 'Data Validator',
  5: 'Concept Architect',
  6: 'Prompt Builder',
  7: 'Website Builder',
}

const MOCK = [1, 2, 3, 4, 5, 6, 7].map(id => ({
  id,
  name: AGENT_NAMES[id],
  status: 'idle',
  lastRun: null,
  successRate: null,
  errorCount: 0,
  leadCount: 0,
}))

// TODO: replace with fetch(`/api/twin/agent-status?id=${agentId}`)
export async function getAgentStatus(agentId = null) {
  if (agentId) return MOCK.find(a => a.id === agentId) || null
  return MOCK
}
