// TODO: fetch(`/api/twin/revenue-summary?period=${period}`)
export async function getRevenueSummary(period = 'month') {
  return {
    period,
    activeClients: 0,
    monthlyRecurring: 0,
    newThisPeriod: 0,
    pendingPayments: 0,
  }
}
