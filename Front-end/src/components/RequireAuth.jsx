import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

export default function RequireAuth({ children, requiredRole }){
  const token = localStorage.getItem('accessToken')
  const role = localStorage.getItem('role')
  const location = useLocation()
  if(!token){
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  if(requiredRole && role !== requiredRole){
    return <Navigate to="/user" replace />
  }
  return (
    <>{children}</>
  )
}
