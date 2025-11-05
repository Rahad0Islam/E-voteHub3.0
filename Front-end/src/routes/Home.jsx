import React from 'react'
import { Link } from 'react-router-dom'

export default function Home(){
  return (
    <div className="grid md:grid-cols-2 gap-10 items-center">
      <div>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Secure, Real‑time Voting Platform</h1>
        <p className="text-slate-300 mb-6">Host events, register nominees and voters, and see live vote counts. Designed with a modern sci‑fi UI.</p>
        <div className="flex gap-4">
          <Link to="/register" className="px-5 py-3 bg-sciAccent text-black font-semibold rounded shadow-neon">Get Started</Link>
          <Link to="/admin" className="px-5 py-3 bg-sciAccent2 text-white font-semibold rounded shadow-neon">Admin Panel</Link>
        </div>
      </div>
      <div className="relative">
        <div className="aspect-video rounded-xl neon-border bg-gradient-to-br from-sciPanel to-black/40 flex items-center justify-center">
          <span className="text-sciAccent/80">E‑voteHub Visualization</span>
        </div>
      </div>
    </div>
  )
}
