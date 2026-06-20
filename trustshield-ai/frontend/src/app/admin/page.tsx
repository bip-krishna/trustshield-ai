'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import { Users, Monitor, Activity, Shield, AlertTriangle, KeyRound, ScanFace } from 'lucide-react'
import { api } from '@/lib/api'
import type { MonitoringData } from '@/types'

export default function AdminOverviewPage() {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [data, setData] = useState<MonitoringData | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!token || !user.is_admin) { router.push('/auth/login'); return }
    api.admin.monitoring().then(setData).catch(() => router.push('/auth/login'))
  }, [router])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  const stats = data ? [
    { label: 'Active Users', value: data.active_users, icon: Users, color: '#22C55E' },
    { label: 'Blocked (1h)', value: data.blocked_users, icon: Shield, color: '#EF4444' },
    { label: 'OTP Requests', value: data.otp_requests, icon: KeyRound, color: '#F59E0B' },
    { label: 'Face Verification', value: data.face_verifications, icon: ScanFace, color: '#3B82F6' },
    { label: 'High Risk Events', value: data.high_risk_events, icon: AlertTriangle, color: '#DC2626' },
  ] : []

  return (
    <div className="min-h-screen">
      <Sidebar isAdmin collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} onLogout={handleLogout} />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'} p-6`}>
        <Navbar title="Admin Dashboard" subtitle="System Monitoring & Control" />

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-4 text-center"
            >
              <stat.icon size={24} className="mx-auto mb-2" style={{ color: stat.color }} />
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-ts-text/60 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold mb-4">Recent Logins</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left py-3 text-ts-text/60 font-medium">User ID</th>
                  <th className="text-left py-3 text-ts-text/60 font-medium">IP Address</th>
                  <th className="text-left py-3 text-ts-text/60 font-medium">Location</th>
                  <th className="text-left py-3 text-ts-text/60 font-medium">Risk Score</th>
                  <th className="text-left py-3 text-ts-text/60 font-medium">Status</th>
                  <th className="text-left py-3 text-ts-text/60 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {data?.recent_logins?.map((login) => (
                  <tr key={login.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3">#{login.user_id}</td>
                    <td className="py-3 text-ts-text/60">{login.ip_address}</td>
                    <td className="py-3">{login.city}, {login.country}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        login.risk_score > 50 ? 'text-ts-danger bg-ts-danger/10' :
                        login.risk_score > 20 ? 'text-ts-warning bg-ts-warning/10' :
                        'text-ts-success bg-ts-success/10'
                      }`}>
                        {Math.round(login.risk_score)}
                      </span>
                    </td>
                    <td className="py-3 capitalize">{login.status.replace('_', ' ')}</td>
                    <td className="py-3 text-ts-text/60">{new Date(login.login_time).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
