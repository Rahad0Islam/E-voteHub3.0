import React, { useEffect, useMemo, useState } from 'react'
import { listEvents, voterRegister, getNominees, giveVote, countVote, getAvailableBallots, nomineeRegister, getVoteStatus, getVoterRegStatus, getNomineeRegStatus } from '../lib/api'
import { io } from 'socket.io-client'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8002'

export default function UserDashboard(){
  const [events, setEvents] = useState([])
  const [active, setActive] = useState(null)
  const [nominees, setNominees] = useState([])
  const [voteSelection, setVoteSelection] = useState({})
  const [rankOrder, setRankOrder] = useState([]) // maintain order for Rank
  const [ballots, setBallots] = useState([])
  const [selectedBallot, setSelectedBallot] = useState(null)
  const [desc, setDesc] = useState('')
  const [results, setResults] = useState(null)
  const [now, setNow] = useState(() => new Date())
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoterRegistered, setIsVoterRegistered] = useState(false)
  const [isNomineeRegistered, setIsNomineeRegistered] = useState(false)
  // Added dashboard metric states
  const [voterCount, setVoterCount] = useState(0)
  const [approvedCount, setApprovedCount] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [participation, setParticipation] = useState(null)
  // Missing state that was referenced later (fix blank page)
  const [phaseRefreshed, setPhaseRefreshed] = useState({ reg:false, start:false, end:false })

  const user = (()=>{ try{return JSON.parse(localStorage.getItem('user')||'null')}catch{return null} })()
  const navigate = useNavigate()

  useEffect(()=>{ listEvents().then(setEvents).catch(()=>{}) },[])

  useEffect(()=>{
    if(!active) return
    getNominees(active._id).then((ns)=>{ setNominees(ns); setApprovedCount(ns.length) })
    if(active.status === 'registration'){
      getAvailableBallots(active._id).then(setBallots)
      getVoterRegStatus(active._id).then(s=> setIsVoterRegistered(!!s.registered))
      getNomineeRegStatus(active._id).then(s=> setIsNomineeRegistered(!!s.registered))
    } else if(active.status === 'finished'){
      countVote(active._id).then(setResults)
    }
    if(active.status === 'voting'){
      getVoteStatus(active._id).then(setHasVoted).catch(()=>setHasVoted(false))
    } else { setHasVoted(false) }

    // fetch pending and voter stats for dashboard boxes
    import('../lib/api').then(async m => {
      try{
        const pending = await m.getPendingNominees(active._id)
        setPendingCount(pending.length)
      }catch{}
      try{
        const votersRes = await (await import('../lib/votersApi')).getVoters(active._id)
        setVoterCount(votersRes.length)
      }catch{}
      try{
        const part = await m.api.get('/api/V1/admin/getVoterPerticipate', { params: { EventID: active._id } })
        const d = part.data?.data
        if(d) setParticipation({ rate: d.VoterPerticapteRate, given: d.givenCount, total: d.givenCount + d.nonCount })
      }catch{}
    })

    const s = io(API_BASE, { withCredentials: true })
    s.emit('joinEvent', active._id)
    s.on('countUpdate', (payload)=>{
      if(payload.eventId === active._id){
        countVote(active._id).then(setResults)
      }
    })
    return ()=>{ s.emit('leaveEvent', active._id); s.disconnect() }
  },[active])

  useEffect(()=>{
    const id = setInterval(()=> setNow(new Date()), 1000)
    return ()=> clearInterval(id)
  },[])

  // Auto refresh when phase timestamps pass (reg end, vote start, vote end)
  useEffect(()=>{
    if(!active) return
    const timers = []
    const parseTs = (v)=>{ const d = new Date(v); return isNaN(d.getTime()) ? null : d.getTime() }
    const schedule = (ts)=>{
      const ms = ts - Date.now()
      if(ms && ms > 0){ const t = setTimeout(()=>{
        listEvents().then(evts=>{
          setEvents(evts||[])
          const updated = (evts||[]).find(e=> e._id === active._id)
          if(updated) setActive(updated)
        }).catch(()=>{})
      }, ms + 100); timers.push(t) }
    }
    const regEnd = parseTs(active.RegEndTime)
    const voteStart = parseTs(active.VoteStartTime)
    const voteEnd = parseTs(active.VoteEndTime)
    if(regEnd) schedule(regEnd)
    if(voteStart) schedule(voteStart)
    if(voteEnd) schedule(voteEnd)
    return ()=> timers.forEach(clearTimeout)
  },[active?._id, active?.RegEndTime, active?.VoteStartTime, active?.VoteEndTime])

  // reset phase flags when changing active event
  useEffect(()=>{
    setPhaseRefreshed({ reg:false, start:false, end:false })
  }, [active?._id])

  // Tick every second already updates `now`. When crossing key times, refresh events/active.
  useEffect(()=>{
    if(!active) return
    const nowMs = now.getTime()
    const toMs = (v)=>{ const d=new Date(v); return isNaN(d.getTime())? null : d.getTime() }
    const regMs = toMs(active.RegEndTime)
    const startMs = toMs(active.VoteStartTime)
    const endMs = toMs(active.VoteEndTime)

    const shouldReg = !!regMs && !phaseRefreshed.reg && nowMs >= regMs
    const shouldStart = !!startMs && !phaseRefreshed.start && nowMs >= startMs
    const shouldEnd = !!endMs && !phaseRefreshed.end && nowMs >= endMs

    if(shouldReg || shouldStart || shouldEnd){
      listEvents().then(evts=>{
        setEvents(evts||[])
        const updated = (evts||[]).find(e=> e._id === active._id)
        if(updated) setActive(updated)
      }).catch(()=>{})
      setPhaseRefreshed(p=>({ reg: p.reg || shouldReg, start: p.start || shouldStart, end: p.end || shouldEnd }))
    }
  }, [now, active])

  const timeLeft = (iso)=>{
    const d = new Date(iso)
    if (!(d instanceof Date) || isNaN(d.getTime())) return '--:--:--'
    const t = d.getTime() - now.getTime()
    if (t <= 0) return '00:00:00'
    const h = String(Math.floor(t/3600000)).padStart(2,'0')
    const m = String(Math.floor((t%3600000)/60000)).padStart(2,'0')
    const s = String(Math.floor((t%60000)/1000)).padStart(2,'0')
    return `${h}:${m}:${s}`
  }

  const onRegisterVoter = async (e)=>{
    e.preventDefault()
    if(!active) return
    try{ await voterRegister(active._id); setIsVoterRegistered(true); alert('Registered for voting') }catch(err){ alert(err?.response?.data?.message || 'Failed to register as voter') }
  }

  const onNominate = async ()=>{
    if(!active) return
    if(!selectedBallot){ alert('Select a ballot image'); return }
    try{
      await nomineeRegister({ EventID: active._id, SelectedBalot:{ url: selectedBallot.url, publicId: selectedBallot.publicId }, Description: desc })
      setIsNomineeRegistered(true)
      alert('Nominee registration submitted (awaiting admin approval)')
    }catch(err){
      alert(err?.response?.data?.message || 'Failed to register as nominee')
    }
  }

  const onVote = async ()=>{
    if(!active) return
    try{
      const ElectionType = active.ElectionType
      let SelectedNominee = []
      if(ElectionType === 'Single'){
        const id = Object.keys(voteSelection)[0]
        if(id) SelectedNominee = [{ NomineeId: id }]
      }else if(ElectionType === 'MultiVote'){
        SelectedNominee = Object.keys(voteSelection).filter(k=>voteSelection[k]).map(id=>({ NomineeId:id }))
      }else{ // Rank: use rankOrder to preserve selection order
        SelectedNominee = rankOrder.map((id, idx)=>({ NomineeId:id, Rank: idx+1 }))
      }
      await giveVote({ EventID: active._id, ElectionType, SelectedNominee })
      setHasVoted(true)
      alert('Voted successfully')
    }catch(err){
      alert(err?.response?.data?.message || 'Vote failed')
    }
  }

  const onLogout = async ()=>{
    const { logout } = await import('../lib/api')
    await logout()
    navigate('/login')
  }

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Sidebar profile (simplified) */}
      <aside className="lg:col-span-1 space-y-4">
        <div className="rounded neon-border overflow-hidden p-4 bg-lightPanel dark:bg-sciPanel">
          <div className="flex items-center gap-3">
            <img src={user?.ProfileImage} className="w-14 h-14 rounded-full object-cover" />
            <div>
              <div className="font-semibold">{user?.FullName}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{user?.Email}</div>
            </div>
          </div>
          <div className="mt-3">
            <Link to="/profile" className="text-sm px-3 py-2 rounded bg-sciAccent text-black">Update Profile</Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:col-span-3 space-y-6">
        {/* Dashboard boxes */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded neon-border">
            <div className="text-xs text-slate-400">Total Voters</div>
            <div className="text-2xl font-bold">{voterCount}</div>
          </div>
          <div className="p-4 rounded neon-border">
            <div className="text-xs text-slate-400">Accepted Nominees</div>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </div>
          <div className="p-4 rounded neon-border">
            <div className="text-xs text-slate-400">Pending Nominees</div>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </div>
          <div className="p-4 rounded neon-border">
            <div className="text-xs text-slate-400">Voter Participation</div>
            <div className="text-2xl font-bold">{participation? participation.rate.toFixed(1): '0.0'}%</div>
            {participation && <div className="text-xs text-slate-400">{participation.given}/{participation.total}</div>}
          </div>
        </div>

        {/* Events & actions */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-xl font-bold">Events</h2>
            {events.length===0 && <div className="text-sm text-slate-400">No events available.</div>}
            {events.map(ev => (
              <button key={ev._id} onClick={()=>{ setActive(ev); setVoteSelection({}); setRankOrder([]); setResults(null); setSelectedBallot(null); setDesc(''); }} className={`w-full text-left p-3 rounded neon-border ${active?._id===ev._id?'bg-sciAccent/10':''}`}>
                <div className="font-semibold">{ev.Title}</div>
                <div className="text-xs text-slate-400">Type: {ev.ElectionType} • Status: {ev.status}</div>
              </button>
            ))}
          </div>
          <div className="lg:col-span-2 space-y-4">
            {!active && <div className="p-6 neon-border rounded">Select an event to continue.</div>}
            {active && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold">{active.Title}</h3>
                  <div className="flex flex-col items-end gap-1 text-xs text-slate-400">
                    <span>Status: <span className="text-sciAccent">{active.status}</span></span>
                    {active.status==='registration' && <div>Reg ends in: <span className="text-sciAccent">{timeLeft(active.RegEndTime)}</span></div>}
                    {active.status==='waiting' && <div>Voting starts in: <span className="text-sciAccent">{timeLeft(active.VoteStartTime)}</span></div>}
                    {active.status==='voting' && <div>Vote ends in: <span className="text-sciAccent">{timeLeft(active.VoteEndTime)}</span></div>}
                    <button onClick={onRegisterVoter} disabled={active.status!=='registration' || isVoterRegistered} className={`mt-1 px-4 py-2 rounded ${active.status==='registration' && !isVoterRegistered ? 'bg-sciAccent text-black' : 'bg-gray-500/40 cursor-not-allowed'}`}>{isVoterRegistered ? 'Already Registered' : 'Register as Voter'}</button>
                  </div>
                </div>

                {active.status === 'registration' && (
                  <div className="p-4 neon-border rounded">
                    <h4 className="font-semibold mb-3">Register as Nominee</h4>
                    <div className="grid md:grid-cols-3 gap-3 mb-3">
                      {ballots.map(b => (
                        <label key={b.publicId} className={`relative block rounded overflow-hidden ${isNomineeRegistered? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${selectedBallot?.publicId===b.publicId? 'ring-2 ring-sciAccent' : ''}`}>
                          <input type="radio" name="ballot" className="absolute opacity-0" disabled={isNomineeRegistered} onChange={()=> setSelectedBallot(b)} />
                          <img src={b.url} className="w-full h-24 object-cover" />
                        </label>
                      ))}
                    </div>
                    <textarea className="w-full p-3 bg-black/30 rounded mb-3" placeholder="Nominee description" disabled={isNomineeRegistered} value={desc} onChange={e=>setDesc(e.target.value)} />
                    <button onClick={onNominate} disabled={isNomineeRegistered} className={`px-4 py-2 rounded ${isNomineeRegistered? 'bg-gray-500/40 cursor-not-allowed' : 'bg-sciAccent2'}`}>{isNomineeRegistered ? 'Already Registered' : 'Submit Nominee'}</button>
                  </div>
                )}

                {active.status === 'voting' && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {nominees.map(n => {
                        const id = n.UserID?._id || n.UserID
                        const isRank = active.ElectionType==='Rank'
                        const checked = isRank ? rankOrder.includes(id) : !!voteSelection[id]
                        const pos = isRank ? rankOrder.indexOf(id) : -1
                        return (
                          <label key={id} className="relative p-4 rounded neon-border flex items-center gap-3">
                            <input
                              type={isRank ? 'checkbox' : (active.ElectionType==='Single'?'radio':'checkbox')}
                              name={isRank ? 'nominee-rank' : (active.ElectionType==='Single'?'nominee-single':'nominee')}
                              checked={checked}
                              onChange={(e)=>{
                                if(isRank){
                                  if(e.target.checked){ setRankOrder(o=> o.includes(id)? o : [...o, id]) }
                                  else { setRankOrder(o=> o.filter(x=> x!==id)) }
                                }else if(active.ElectionType==='Single'){
                                  setVoteSelection({ [id]: true })
                                }else{
                                  setVoteSelection(s=> ({ ...s, [id]: e.target.checked }))
                                }
                              }}
                            />
                            {isRank && pos>=0 && (
                              <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-sciAccent text-black text-xs font-bold flex items-center justify-center border border-black/30">{pos+1}</span>
                            )}
                            <img src={n.SelectedBalot?.url || n.UserID?.ProfileImage} alt="" className="w-12 h-12 rounded object-cover" />
                            <div>
                              <div className="font-semibold">{n.UserID?.FullName || id}</div>
                              <div className="text-xs text-slate-400">@{n.UserID?.UserName}</div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                    <div className="flex justify-end items-center gap-3">
                      {(!hasVoted) && ((active.ElectionType==='Rank' ? rankOrder.length===0 : Object.keys(voteSelection).length===0)) && (
                        <span className="text-xs text-red-400">Select {active.ElectionType==='Single'?'one nominee':'at least one nominee'} to enable Submit</span>
                      )}
                      {hasVoted ? (
                        <span className="px-6 py-3 rounded bg-emerald-600/30 text-emerald-300 border border-emerald-500/40">Already voted</span>
                      ) : (
                        <button onClick={onVote} disabled={(active.ElectionType==='Rank' ? rankOrder.length===0 : Object.keys(voteSelection).length===0)} className={`px-6 py-3 rounded ${(active.ElectionType==='Rank' ? rankOrder.length===0 : Object.keys(voteSelection).length===0)? 'bg-gray-500/40 cursor-not-allowed' : 'bg-sciAccent2'}`}>{(active.ElectionType==='Rank' ? (rankOrder.length? 'Submit Vote' : 'Select nominees (1,2,3...)') : (Object.keys(voteSelection).length? 'Submit Vote' : 'Select nominee(s) to vote'))}</button>
                      )}
                    </div>
                  </div>
                )}

                {active.status === 'finished' && (
                  <div className="p-4 neon-border rounded">
                    <h4 className="font-semibold mb-3">Results</h4>
                    {results ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-slate-300 mb-2">Single/Multi Totals</div>
                          <ul className="space-y-2">
                            {results.NomineeListForSingleAndMultiVote?.map(r => (
                              <li key={r.NomineeID} className="flex justify-between bg-black/20 p-2 rounded">
                                <span>{r.NomineeIDName || r.NomineeID}</span>
                                <span className="text-sciAccent">{r.TotalVote}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-sm text-slate-300 mb-2">Ranked Totals (lower is better)</div>
                          <ul className="space-y-2">
                            {results.NomineeListForRank?.map(r => (
                              <li key={r.NomineeID} className="flex justify-between bg-black/20 p-2 rounded">
                                <span>{r.NomineeIDName || r.NomineeID}</span>
                                <span className="text-sciAccent">{r.TotalRank}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="text-slate-400">No results yet.</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
