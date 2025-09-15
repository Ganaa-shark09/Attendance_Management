import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'


export const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: Array<'student'|'teacher'|'hod'> }>
= ({ children, roles }) => {
const { user } = useAuth()
if (!user) return <Navigate to="/login" replace />
if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />
return <>{children}</>
}