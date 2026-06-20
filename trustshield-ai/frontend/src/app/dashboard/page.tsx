'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import {
  Shield, ShieldCheck, ShieldAlert, Globe, Monitor,
  ArrowRightLeft, Clock, MapPin, Smartphone, Activity, AlertTriangle,
} from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate, getRiskColor, getRiskLabel, getStatusColor, getStatusLabel } from '@/lib/utils'
import type { DashboardData } from '@/types'

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/auth/login'); return }

    api.users.dashboard()
      .then(setData)
      .catch(() => {
        localStorage.removeItem('token')
        router.push('/auth/login')
      })
      .finally(() => setLoading(false))
  }, [router])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="animate-pulse text-ts-primary mx-auto mb-4" size={48} />
          <p className="text-ts-text/60">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const riskScore = 100 - data.trust_score
  const currentLogin = data.recent_logins[0]

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} onLogout={handleLogout} />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'} p-6`}>
        <Navbar title={`Welcome, ${data.user.full_name}`} subtitle="Identity Trust Dashboard" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 col-span-2"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Trust Score</h2>
              <ShieldCheck className="text-ts-success" size={24} />
            </div>
            <div className="flex items-center gap-6">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(59,130,246,0.1)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke={getRiskColor(riskScore)} strokeWidth="8"
                    strokeDasharray={`${riskScore * 2.83} ${283 - riskScore * 2.83}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: getRiskColor(riskScore) }}>{Math.round(riskScore)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-ts-text/60">Status:</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{
                    background: `${getRiskColor(riskScore)}20`,
                    color: getRiskColor(riskScore),
                  }}>
                    {getRiskLabel(riskScore)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-ts-text/60">
                  <Monitor size={14} /> {data.trusted_devices.length} Trusted Devices
                </div>
                <div className="flex items-center gap-2 text-sm text-ts-text/60">
                  <Activity size={14} /> {data.risk_events.length} Risk Events
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Current Session</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Globe size={16} className="text-ts-primary" />
                <div>
                  <p className="text-ts-text/60">Location</p>
                  <p>{currentLogin?.city || 'Unknown'}, {currentLogin?.country || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Monitor size={16} className="text-ts-primary" />
                <div>
                  <p className="text-ts-text/60">Device</p>
                  <p>{currentLogin?.device_name || 'Unknown'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock size={16} className="text-ts-primary" />
                <div>
                  <p className="text-ts-text/60">Last Login</p>
                  <p>{currentLogin ? formatDate(currentLogin.login_time) : 'N/A'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Recent Logins</h2>
            <div className="space-y-3">
              {data.recent_logins.slice(0, 5).map((login) => (
                <div key={login.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-ts-text/40" />
                    <div>
                      <p className="text-sm">{login.city || 'Unknown'}, {login.country || 'Unknown'}</p>
                      <p className="text-xs text-ts-text/40">{formatDate(login.login_time)}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{
                    background: `${getStatusColor(login.status)}20`,
                    color: getStatusColor(login.status),
                  }}>
                    {getStatusLabel(login.status)}
                  </span>
                </div>
              ))}
              {data.recent_logins.length === 0 && (
                <p className="text-sm text-ts-text/40 text-center py-4">No login history</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
            <div className="space-y-3">
              {data.recent_transactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-3">
                    <ArrowRightLeft size={16} className="text-ts-text/40" />
                    <div>
                      <p className="text-sm">{tx.recipient}</p>
                      <p className="text-xs text-ts-text/40">{formatDate(tx.transaction_time)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${tx.amount.toLocaleString()}</p>
                    <span className="text-xs" style={{ color: getRiskColor(tx.risk_score) }}>
                      Score: {Math.round(tx.risk_score)}
                    </span>
                  </div>
                </div>
              ))}
              {data.recent_transactions.length === 0 && (
                <p className="text-sm text-ts-text/40 text-center py-4">No transactions yet</p>
              )}
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Trusted Devices</h2>
            <div className="space-y-3">
              {data.trusted_devices.map((device) => (
                <div key={device.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <Smartphone size={16} className="text-ts-success" />
                  <div>
                    <p className="text-sm">{device.device_name || 'Unknown Device'}</p>
                    <p className="text-xs text-ts-text/40">
                      {device.browser?.slice(0, 30)}... | {device.operating_system}
                    </p>
                  </div>
                  <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-ts-success/10 text-ts-success">
                    Trusted
                  </span>
                </div>
              ))}
              {data.trusted_devices.length === 0 && (
                <p className="text-sm text-ts-text/40 text-center py-4">No trusted devices</p>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Security Events</h2>
            <div className="space-y-3">
              {data.risk_events.slice(0, 5).map((event) => (
                <div key={event.id} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                  <AlertTriangle size={16} className="text-ts-warning mt-0.5" />
                  <div>
                    <p className="text-sm capitalize">{event.event_type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-ts-text/40">{event.description?.slice(0, 60)}</p>
                  </div>
                  <span className="ml-auto text-xs font-medium" style={{ color: getRiskColor(event.risk_points) }}>
                    +{event.risk_points}
                  </span>
                </div>
              ))}
              {data.risk_events.length === 0 && (
                <p className="text-sm text-ts-text/40 text-center py-4">No security events</p>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
