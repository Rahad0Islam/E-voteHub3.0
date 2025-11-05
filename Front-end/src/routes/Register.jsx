import React, { useState } from 'react'
import { register } from '../lib/api'

export default function Register(){
  const [form, setForm] = useState({ FullName:'', UserName:'', Email:'', DateOfBirth:'', Gender:'male', Password:'', NID:'', PhoneNumber:'' })
  const [profile, setProfile] = useState(null)
  const [cover, setCover] = useState(null)

  const onSubmit = async (e)=>{
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k,v])=>fd.append(k,v))
    if(profile) fd.append('ProfileImage', profile)
    if(cover) fd.append('CoverImage', cover)
    try{
      await register(fd)
      alert('Registered successfully. Now login.')
    }catch(err){
      alert(err?.response?.data?.message || 'Register failed')
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 neon-border rounded-xl bg-lightPanel dark:bg-sciPanel">
      <h2 className="text-2xl font-bold mb-4">Create Account</h2>
      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input className="p-3 bg-black/5 dark:bg-black/30 rounded" placeholder="Full Name" onChange={e=>setForm({...form, FullName:e.target.value})} />
        <input className="p-3 bg-black/5 dark:bg-black/30 rounded" placeholder="Username" onChange={e=>setForm({...form, UserName:e.target.value})} />
        <input className="p-3 bg-black/5 dark:bg-black/30 rounded" placeholder="Email" type="email" onChange={e=>setForm({...form, Email:e.target.value})} />
        <input className="p-3 bg-black/5 dark:bg-black/30 rounded" placeholder="Date of Birth" type="date" onChange={e=>setForm({...form, DateOfBirth:e.target.value})} />
        <select className="p-3 bg-black/5 dark:bg-black/30 rounded" onChange={e=>setForm({...form, Gender:e.target.value})}>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </select>
        <input className="p-3 bg-black/5 dark:bg-black/30 rounded" placeholder="Password" type="password" onChange={e=>setForm({...form, Password:e.target.value})} />
        <input className="p-3 bg-black/5 dark:bg-black/30 rounded" placeholder="NID" onChange={e=>setForm({...form, NID:e.target.value})} />
        <input className="p-3 bg-black/5 dark:bg-black/30 rounded" placeholder="Phone Number" onChange={e=>setForm({...form, PhoneNumber:e.target.value})} />
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Profile Image</label>
          <input type="file" onChange={e=>setProfile(e.target.files[0])} />
        </div>
        <div>
          <label className="block text-sm text-slate-600 dark:text-slate-300 mb-1">Cover Image</label>
          <input type="file" onChange={e=>setCover(e.target.files[0])} />
        </div>
        <div className="md:col-span-2">
          <button className="w-full py-3 bg-sciAccent text-black font-semibold rounded shadow-neon">Create Account</button>
        </div>
      </form>
    </div>
  )
}
