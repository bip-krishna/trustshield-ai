'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import { Shield, ShieldOff, Trash2, KeyRound } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

interface AdminUser {
  id: number; full_name: string; email: string; is_active: boolean
  is_admin: boolean; trust_score: number; created_at: string
  last_login: string | null; failed_login_attempts: number
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [users, setUsers] = useState<AdminUser[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!token || !user.is_admin) { router.push('/auth/login'); return }
    api.admin.users().then(setUsers).catch(() => router.push('/auth/login'))
  }, [router])

  function handleLogout() {
    localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/auth/login')
  }

  async function toggleStatus(id: number) {
    const res = await api.admin.toggleUserStatus(id)
    setUsers(users.map(u => u.id === id ? { ...u, is_active: !u.is_active } : u))
    toast.success(res.message)
  }

  async function deleteUser(id: number) {
    if (!confirm('Delete this user?')) return
    await api.admin.deleteUser(id)
    setUsers(users.filter(u => u.id !== id))
    toast.success('User deleted')
  }

  async function resetPassword(id: number) {
    const res = await api.admin.resetPassword(id)
    toast.success(`Password reset: ${res.new_password}`)
  }

  return (
    <div className="min-h-screen">
      <Sidebar isAdmin collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} onLogout={handleLogout} />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'} p-6`}>
        <Navbar title="User Management" subtitle="Manage all registered users" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 text-ts-text/60 font-medium">Name</th>
                <th className="text-left py-3 text-ts-text/60 font-medium">Email</th>
                <th className="text-left py-3 text-ts-text/60 font-medium">Status</th>
                <th className="text-left py-3 text-ts-text/60 font-medium">Trust Score</th>
                <th className="text-left py-3 text-ts-text/60 font-medium">Failed Logins</th>
                <th className="text-left py-3 text-ts-text/60 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 font-medium">{user.full_name}</td>
                  <td className="py-3 text-ts-text/60">{user.email}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${user.is_active ? 'bg-ts-success/10 text-ts-success' : 'bg-ts-danger/10 text-ts-danger'}`}>
                      {user.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="py-3">{Math.round(user.trust_score)}%</td>
                  <td className="py-3">{user.failed_login_attempts}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button onClick={() => toggleStatus(user.id)} className="p-1.5 rounded-lg hover:bg-white/10" title={user.is_active ? 'Suspend' : 'Activate'}>
                        {user.is_active ? <ShieldOff size={16} className="text-ts-warning" /> : <Shield size={16} className="text-ts-success" />}
                      </button>
                      <button onClick={() => resetPassword(user.id)} className="p-1.5 rounded-lg hover:bg-white/10" title="Reset Password">
                        <KeyRound size={16} className="text-ts-primary" />
                      </button>
                      <button onClick={() => deleteUser(user.id)} className="p-1.5 rounded-lg hover:bg-white/10" title="Delete">
                        <Trash2 size={16} className="text-ts-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </main>
    </div>
  )
}
