import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8002'

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

// Attach token automatically from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function login({ UserName, Email, Password }){
  const res = await api.post('/api/v1/users/login', { UserName, Email, Password })
  const { AccessToken, RefreshToken, LogInUser } = res.data?.data || {}
  if (AccessToken) localStorage.setItem('accessToken', AccessToken)
  if (RefreshToken) localStorage.setItem('refreshToken', RefreshToken)
  if (LogInUser?.Role) localStorage.setItem('role', LogInUser.Role)
  if (LogInUser) localStorage.setItem('user', JSON.stringify(LogInUser))
  return res.data
}

export function getUser(){
  try{ return JSON.parse(localStorage.getItem('user') || 'null') }catch{return null}
}

export function setUser(u){
  if(u) localStorage.setItem('user', JSON.stringify(u))
}

export async function logout(){
  try{ await api.post('/api/v1/users/logout') } catch(e) { /* ignore */ }
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('role')
  localStorage.removeItem('user')
}

export async function register(formData){
  const res = await api.post('/api/v1/users/register', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data
}

export async function renew(){
  const rt = localStorage.getItem('refreshToken')
  if (!rt) return null
  const res = await api.post('/api/v1/users/renewaccestoken', { RefreshToken: rt })
  const { AccessToken, RefreshToken } = res.data?.data || {}
  if (AccessToken) localStorage.setItem('accessToken', AccessToken)
  if (RefreshToken) localStorage.setItem('refreshToken', RefreshToken)
  return res.data
}

export async function updateProfileImage(file){
  const fd = new FormData()
  fd.append('ProfileImage', file)
  const res = await api.patch('/api/v1/users/UpdateProfilePicture', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  const user = res.data?.data
  if(user) setUser(user)
  return user
}

export async function updateCoverImage(file){
  const fd = new FormData()
  fd.append('CoverImage', file)
  const res = await api.patch('/api/v1/users/UpdateCoverPicture', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  const user = res.data?.data
  if(user) setUser(user)
  return user
}

export async function listEvents(){
  const res = await api.get('/api/V1/admin/events')
  return res.data?.data || []
}

export async function createEvent(payload){
  const fd = new FormData()
  fd.append('Title', payload.Title)
  if (payload.Description) fd.append('Description', payload.Description)
  fd.append('RegEndTime', payload.RegEndTime)
  fd.append('VoteStartTime', payload.VoteStartTime)
  fd.append('VoteEndTime', payload.VoteEndTime)
  fd.append('ElectionType', payload.ElectionType)
  ;(payload.BallotImageFiles || []).forEach(file => fd.append('BallotImage', file))
  const res = await api.post('/api/V1/admin/VoteEvent', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data?.data
}

export async function countVote(eventId){
  const res = await api.get('/api/V1/admin/countvote', { params: { EventID: eventId } })
  return res.data?.data
}

export async function getNominees(eventId){
  const res = await api.get('/api/V1/admin/getApproveNominee', { params: { EventID: eventId } })
  return res.data?.data?.NomineeDetails || []
}

export async function getAvailableBallots(eventId){
  const res = await api.get('/api/V1/admin/getAvailableBallot', { params: { EventID: eventId } })
  return res.data?.data || []
}

export async function getPendingNominees(eventId){
  const res = await api.get('/api/V1/admin/getPendingNominee', { params: { EventID: eventId } })
  return res.data?.data?.NomineeDetails || []
}

export async function approveNominee({ EventID, NomineeID }){
  const res = await api.post('/api/V1/admin/nomineeApproval', { EventID, NomineeID })
  return res.data?.data
}

export async function voterRegister(eventId){
  const res = await api.post('/api/V1/admin/voterReg', { EventID: eventId })
  return res.data?.data
}

export async function nomineeRegister(payload){
  const res = await api.post('/api/V1/admin/nomineReg', payload)
  return res.data?.data
}

export async function giveVote(payload){
  const res = await api.post('/api/V1/admin/voting', payload)
  return res.data?.data
}

export async function getVoteStatus(eventId){
  const res = await api.get('/api/V1/admin/voteStatus', { params: { EventID: eventId } })
  return !!(res.data?.data?.hasVoted)
}

export async function getVoterRegStatus(eventId){
  const res = await api.get('/api/V1/admin/voterRegStatus', { params: { EventID: eventId } })
  return res.data?.data || { registered:false, hasVoted:false }
}

export async function getNomineeRegStatus(eventId){
  const res = await api.get('/api/V1/admin/nomineeRegStatus', { params: { EventID: eventId } })
  return res.data?.data || { registered:false, approved:false }
}
