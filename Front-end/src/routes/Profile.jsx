import React, { useEffect, useRef, useState } from 'react'
import { getUser, updateCoverImage, updateProfileImage, setUser } from '../lib/api'

export default function Profile(){
  const [user, setUserState] = useState(()=> getUser() || {})
  const [busy, setBusy] = useState(false)
  const coverInput = useRef(null)
  const avatarInput = useRef(null)

  useEffect(()=>{
    const onStorage = ()=> setUserState(getUser() || {})
    window.addEventListener('storage', onStorage)
    return ()=> window.removeEventListener('storage', onStorage)
  },[])

  const onPickCover = ()=> coverInput.current?.click()
  const onPickAvatar = ()=> avatarInput.current?.click()

  const onCoverChange = async (e)=>{
    const file = e.target.files?.[0]
    if(!file) return
    try{ setBusy(true); const updated = await updateCoverImage(file); if(updated){ setUser(updated); setUserState(updated) } }
    catch(err){ alert(err?.response?.data?.message || 'Failed to update cover') }
    finally{ setBusy(false) }
  }
  const onAvatarChange = async (e)=>{
    const file = e.target.files?.[0]
    if(!file) return
    try{ setBusy(true); const updated = await updateProfileImage(file); if(updated){ setUser(updated); setUserState(updated) } }
    catch(err){ alert(err?.response?.data?.message || 'Failed to update profile photo') }
    finally{ setBusy(false) }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="relative rounded-xl overflow-hidden neon-border">
        <div className="aspect-[3/1] bg-black/30">
          {user.CoverImage && (
            <img src={user.CoverImage} className="w-full h-full object-cover" alt="cover" />
          )}
        </div>
        <button onClick={onPickCover} disabled={busy} className="absolute top-3 right-3 px-3 py-1 text-sm rounded bg-sciAccent text-black disabled:opacity-60">Change Cover</button>
        <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={onCoverChange} />

        <div className="absolute -bottom-10 left-6 flex items-end gap-4">
          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full ring-4 ring-sciBg overflow-hidden bg-black/20">
            {user.ProfileImage && (
              <img src={user.ProfileImage} className="w-full h-full object-cover" alt="avatar" />
            )}
            <button onClick={onPickAvatar} disabled={busy} className="absolute bottom-1 right-1 px-2 py-0.5 text-xs rounded bg-sciAccent2 text-white disabled:opacity-60">Change</button>
            <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
          </div>
          <div className="pb-2">
            <div className="text-xl md:text-2xl font-bold">{user.FullName || 'Your Name'}</div>
            <div className="text-sm text-slate-400">@{user.UserName} • {user.Email}</div>
            <div className="mt-1 text-xs px-2 py-0.5 rounded bg-black/30 inline-block">Role: {user.Role || 'user'}</div>
          </div>
        </div>
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 p-4 rounded neon-border bg-lightPanel dark:bg-sciPanel">
          <h3 className="font-semibold mb-3">About</h3>
          <div className="text-sm text-slate-300 space-y-1">
            <div>Name: {user.FullName}</div>
            <div>Username: @{user.UserName}</div>
            <div>Email: {user.Email}</div>
            <div>Gender: {user.Gender}</div>
            <div>NID: {user.NID}</div>
            <div>Phone: {user.PhoneNumber || '—'}</div>
            <div>DOB: {user.DateOfBirth ? new Date(user.DateOfBirth).toLocaleDateString() : '—'}</div>
          </div>
        </div>
        <div className="p-4 rounded neon-border bg-lightPanel dark:bg-sciPanel">
          <h3 className="font-semibold mb-3">Actions</h3>
          <ul className="text-sm space-y-2 text-slate-300">
            <li>• Update your cover and profile images</li>
            <li>• View your public information</li>
            <li>• More settings coming soon</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
