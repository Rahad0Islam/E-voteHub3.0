import { api } from './api'

export async function getVoters(eventId){
  const res = await api.get('/api/V1/admin/getVoterDetails', { params: { EventID: eventId } })
  return res.data?.data?.VoterDetails || []
}
