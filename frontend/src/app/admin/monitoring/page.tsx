'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import { Activity, Users, Shield, AlertTriangle, KeyRound, ScanFace } from 'lucide-react'
import { api } from '@/lib/api'
import type { MonitoringData } from '@/types'

export default function AdminMonitoringPage() {
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
    localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/auth/login')
  }

  const stats = data ? [
    { label: 'Active Users', value: data.active_users, icon: Users, color: '#22C55E' },
    { label: 'Total Users', value: data.total_users, icon: Users, color: '#3B82F6' },
    { label: 'Blocked (1h)', value: data.blocked_users, icon: Shield, color: '#EF4444' },
    { label: 'OTP Requests', value: data.otp_requests, icon: KeyRound, color: '#F59E0B' },
    { label: 'Face Verifications', value: data.face_verifications, icon: ScanFace, color: '#3B82F6' },
    { label: 'High Risk Events', value: data.high_risk_events, icon: AlertTriangle, color: '#DC2626' },
  ] : []

  return (
    <div className="min-h-screen">
      <Sidebar isAdmin collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} onLogout={handleLogout} />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'} p-6`}>
        <Navbar title="Live Monitoring" subtitle="Real-time system monitoring" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass rounded-2xl p-4 text-center">
              <stat.icon size={24} className="mx-auto mb-2" style={{ color: stat.color }} />
              <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs text-ts-text/60 mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {data?.recent_logins?.slice(0, 10).map(login => (
              <div key={login.id} className="flex items-center justify-between py-2 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Activity size={14} className="text-ts-primary" />
                  <span className="text-sm">User #{login.user_id} from {login.city || '?'}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  login.status === 'allowed' ? 'bg-ts-success/10 text-ts-success' :
                  login.status === 'blocked' ? 'bg-ts-danger/10 text-ts-danger' :
                  'bg-ts-warning/10 text-ts-warning'
                }`}>{login.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
