import React, { useEffect, useMemo, useState } from 'react'
import { listEvents, countVote, getPendingNominees, approveNominee, createEvent } from '../lib/api'
import { io } from 'socket.io-client'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'
import { getVoters } from '../lib/votersApi'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8002'

export default function AdminDashboard(){
  const [events, setEvents] = useState([])
  const [active, setActive] = useState(null)
  const [counts, setCounts] = useState({ simple: [], rank: [] })
  const [pending, setPending] = useState([])
  const [voters, setVoters] = useState([])

  // event creation state
  const [newEvent, setNewEvent] = useState({ Title:'', Description:'', RegEndTime:'', VoteStartTime:'', VoteEndTime:'', ElectionType:'Single' })
  const [ballotFiles, setBallotFiles] = useState([])

  useEffect(()=>{ listEvents().then(setEvents) },[])

  useEffect(()=>{
    if(!active) return
    const s = io(API_BASE, { withCredentials: true })
    s.emit('joinEvent', active._id)
    s.on('voteUpdate', async (payload)=>{
      if(payload.eventId === active._id){
        const c = await countVote(active._id)
        setCounts({ simple: c.NomineeListForSingleAndMultiVote, rank: c.NomineeListForRank })
      }
    })
    // initial fetch
    countVote(active._id).then(c=> setCounts({ simple: c.NomineeListForSingleAndMultiVote, rank: c.NomineeListForRank }))
    getPendingNominees(active._id).then(setPending)
    getVoters(active._id).then(setVoters)

    return ()=>{ s.emit('leaveEvent', active._id); s.disconnect() }
  },[active])

  const onApprove = async (uid)=>{
    try{
      await approveNominee({ EventID: active._id, NomineeID: uid })
      setPending(p => p.filter(x => (x.UserID?._id || x.UserID) !== uid))
    }catch(err){
      alert(err?.response?.data?.message || 'Approval failed')
    }
  }

  const onCreateEvent = async (e)=>{
    e.preventDefault()
    try{
      const data = await createEvent({ ...newEvent, BallotImageFiles: ballotFiles })
      alert('Event created')
      setNewEvent({ Title:'', Description:'', RegEndTime:'', VoteStartTime:'', VoteEndTime:'', ElectionType:'Single' })
      setBallotFiles([])
      const updated = await listEvents()
      setEvents(updated)
    }catch(err){
      alert(err?.response?.data?.message || 'Failed to create event')
    }
  }

  const barData = useMemo(()=>{
    const labels = counts.simple.map(x=>x.NomineeIDName || x.NomineeID)
    return {
      labels,
      datasets: [{
        label: 'Votes',
        data: counts.simple.map(x=>x.TotalVote),
        backgroundColor: 'rgba(0,229,255,0.5)',
        borderColor: 'rgba(0,229,255,1)',
        borderWidth: 1
      }]
    }
  },[counts])

  const doughnutData = useMemo(()=>{
    const labels = counts.rank.map(x=>x.NomineeIDName || x.NomineeID)
    return {
      labels,
      datasets: [{
        label: 'Total Rank (lower better)',
        data: counts.rank.map(x=>x.TotalRank),
        backgroundColor: ['#00e5ff','#7c4dff','#14b8a6','#f59e0b','#ef4444']
      }]
    }
  },[counts])

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Admin Control Center</h2>

      {/* Create Event */}
      <div className="p-4 rounded neon-border bg-sciPanel">
        <h3 className="mb-3 font-semibold">Create Event</h3>
        <form onSubmit={onCreateEvent} className="grid md:grid-cols-2 gap-4">
          <input className="p-2 rounded bg-black/30" placeholder="Title" value={newEvent.Title} onChange={e=>setNewEvent({...newEvent, Title:e.target.value})} />
          <select className="p-2 rounded bg-black/30" value={newEvent.ElectionType} onChange={e=>setNewEvent({...newEvent, ElectionType:e.target.value})}>
            <option value="Single">Single</option>
            <option value="MultiVote">MultiVote</option>
            <option value="Rank">Rank</option>
          </select>
          <textarea className="p-2 rounded bg-black/30 md:col-span-2" placeholder="Description (optional)" value={newEvent.Description} onChange={e=>setNewEvent({...newEvent, Description:e.target.value})} />
          <label className="text-sm text-slate-300">Registration End
            <input type="datetime-local" className="block w-full p-2 rounded bg-black/30" value={newEvent.RegEndTime} onChange={e=>setNewEvent({...newEvent, RegEndTime:e.target.value})} />
          </label>
          <label className="text-sm text-slate-300">Vote Start
            <input type="datetime-local" className="block w-full p-2 rounded bg-black/30" value={newEvent.VoteStartTime} onChange={e=>setNewEvent({...newEvent, VoteStartTime:e.target.value})} />
          </label>
          <label className="text-sm text-slate-300">Vote End
            <input type="datetime-local" className="block w-full p-2 rounded bg-black/30" value={newEvent.VoteEndTime} onChange={e=>setNewEvent({...newEvent, VoteEndTime:e.target.value})} />
          </label>
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-300 mb-1">Ballot Images (1..10)</label>
            <input type="file" multiple onChange={e=>setBallotFiles(Array.from(e.target.files))} />
          </div>
          <div className="md:col-span-2">
            <button className="px-4 py-2 bg-sciAccent text-black rounded">Create Event</button>
          </div>
        </form>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-3">
          {events.map(ev => (
            <button key={ev._id} onClick={()=>setActive(ev)} className={`w-full text-left p-3 rounded neon-border ${active?._id===ev._id?'bg-sciAccent/10':''}`}>
              <div className="font-semibold">{ev.Title}</div>
              <div className="text-xs text-slate-400">Type: {ev.ElectionType} • Status: {ev.status}</div>
            </button>
          ))}
          {active && (
            <div className="p-3 rounded neon-border">
              <h4 className="font-semibold mb-2">Pending Nominees</h4>
              <div className="space-y-2 max-h-60 overflow-auto pr-2">
                {pending.map(p => {
                  const id = p.UserID?._id || p.UserID
                  return (
                    <div key={id} className="flex items-center justify-between gap-3 p-2 bg-black/20 rounded">
                      <div className="flex items-center gap-2">
                        <img src={p.UserID?.ProfileImage} className="w-8 h-8 rounded-full" />
                        <div>
                          <div className="text-sm font-semibold">{p.UserID?.FullName || id}</div>
                          <div className="text-xs text-slate-400">@{p.UserID?.UserName}</div>
                        </div>
                      </div>
                      <button onClick={()=>onApprove(id)} className="px-3 py-1 text-xs bg-sciAccent text-black rounded">Approve</button>
                    </div>
                  )
                })}
                {pending.length===0 && <div className="text-sm text-slate-400">No pending nominees</div>}
              </div>
            </div>
          )}
          {active && (
            <div className="p-3 rounded neon-border">
              <h4 className="font-semibold mb-2">Registered Voters ({voters.length})</h4>
              <div className="space-y-2 max-h-48 overflow-auto pr-2">
                {voters.map(v => (
                  <div key={v.UserID?._id || v.UserID} className="flex items-center gap-2 text-sm bg-black/20 rounded p-2">
                    <img src={v.UserID?.ProfileImage} className="w-6 h-6 rounded-full"/>
                    <span>{v.UserID?.FullName || v.UserID}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-2 grid gap-6">
          <div className="p-4 rounded neon-border bg-sciPanel">
            <h3 className="mb-3 font-semibold">Live Votes</h3>
            <Bar data={barData} options={{ responsive:true, plugins:{ legend:{ labels:{ color:'#a3a3a3' }}, tooltip:{ enabled:true }}, scales:{ x:{ ticks:{ color:'#a3a3a3' }}, y:{ ticks:{ color:'#a3a3a3' }}} }} />
          </div>
          <div className="p-4 rounded neon-border bg-sciPanel">
            <h3 className="mb-3 font-semibold">Ranked Choice Totals</h3>
            <Doughnut data={doughnutData} options={{ plugins:{ legend:{ labels:{ color:'#a3a3a3' }}} }} />
          </div>
        </div>
      </div>
    </div>
  )
}
