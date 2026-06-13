// TODO: fetch(`/api/twin/workflow-errors?limit=${limit}${agentId ? `&agent_id=${agentId}` : ''}`)
export async function getWorkflowErrors(limit = 10, agentId = null) {
  return { errors: [], count: 0, limit, agentId }
}
