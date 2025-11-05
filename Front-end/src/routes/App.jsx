import React, { useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom'
import Home from './Home.jsx'
import Login from './Login.jsx'
import Register from './Register.jsx'
import UserDashboard from './UserDashboard.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import RequireAuth from '../components/RequireAuth.jsx'
import { logout } from '../lib/api'
import Profile from './Profile.jsx'

export default function App(){
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('accessToken'))
  const [user, setUser] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('user')||'null')}catch{return null} })
  const navigate = useNavigate()
  useEffect(()=>{
    const root = document.documentElement
    if(theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  },[theme])
  useEffect(()=>{
    const onStorage = ()=>{
      setAuthed(!!localStorage.getItem('accessToken'))
      try{ setUser(JSON.parse(localStorage.getItem('user')||'null')) }catch{ setUser(null) }
    }
    window.addEventListener('storage', onStorage)
    const id = setInterval(onStorage, 800)
    return ()=>{ window.removeEventListener('storage', onStorage); clearInterval(id) }
  },[])

  const doLogout = async ()=>{
    await logout()
    setAuthed(false)
    setUser(null)
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-lightBg text-lightText dark:bg-sciBg dark:text-white transition-colors">
      <header className="sticky top-0 z-10 bg-lightPanel/80 dark:bg-sciPanel/80 backdrop-blur border-b border-sciAccent/20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-2xl font-extrabold tracking-widest text-sciAccent drop-shadow">E-voteHub</Link>
          <nav className="flex items-center gap-4 text-sm relative">
            <Link to="/" className="hover:text-sciAccent">Home</Link>
            {!authed && <Link to="/login" className="hover:text-sciAccent">Login</Link>}
            {!authed && <Link to="/register" className="hover:text-sciAccent">Register</Link>}
            {authed && <Link to="/user" className="hover:text-sciAccent">User</Link>}
            {authed && <Link to="/profile" className="hover:text-sciAccent">Profile</Link>}
            {authed && localStorage.getItem('role')==='admin' && <Link to="/admin" className="hover:text-sciAccent">Admin</Link>}
            <button onClick={()=> setTheme(t => t==='dark'?'light':'dark')} className="px-3 py-1 rounded border border-sciAccent/40">
              {theme==='dark'?'Light':'Dark'} Mode
            </button>
            {authed && user && (
              <Link to="/profile" className="w-8 h-8 rounded-full ring-2 ring-sciAccent/40 overflow-hidden">
                <img src={user.ProfileImage} className="w-full h-full object-cover" alt="avatar" />
              </Link>
            )}
            {authed && <button onClick={doLogout} className="px-3 py-1 rounded border border-sciAccent/40">Logout</button>}
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/user" element={<RequireAuth><UserDashboard /></RequireAuth>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth requiredRole="admin"><AdminDashboard /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  )
}
