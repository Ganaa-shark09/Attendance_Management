import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../lib/api'


export const NavBar: React.FC = () => {
const { user } = useAuth()
return (
<div className="w-full border-b px-4 py-3 flex items-center justify-between">
<div className="font-semibold">Attendance AMS</div>
<div className="flex items-center gap-3">
{user && <span className="text-sm opacity-70">{user.username} ({user.role})</span>}
{user ? (
<button onClick={logout} className="px-3 py-1 rounded bg-black text-white">Logout</button>
) : (
<Link to="/login" className="px-3 py-1 rounded bg-black text-white">Login</Link>
)}
</div>
</div>
)
}