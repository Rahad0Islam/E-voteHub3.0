import React, { useState } from 'react'
import { login, renew } from '../lib/api'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [UserName, setUserName] = useState('')
  const [Password, setPassword] = useState('')
  const navigate = useNavigate()

  const onSubmit = async (e)=>{
    e.preventDefault()
    try{
      await login({ UserName, Password })
      await renew() // ensure fresh tokens
      navigate('/user')
    }catch(err){
      alert(err?.response?.data?.message || 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 neon-border rounded-xl bg-sciPanel">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <input className="w-full p-3 bg-black/30 rounded outline-none" placeholder="Username" value={UserName} onChange={e=>setUserName(e.target.value)} />
        <input className="w-full p-3 bg-black/30 rounded outline-none" placeholder="Password" type="password" value={Password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full py-3 bg-sciAccent text-black font-semibold rounded shadow-neon">Sign In</button>
      </form>
    </div>
  )
}
