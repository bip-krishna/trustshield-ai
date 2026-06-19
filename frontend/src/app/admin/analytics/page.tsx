'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import { BarChart3, TrendingUp, Globe, Monitor, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'
import type { AnalyticsData } from '@/types'

const COLORS = ['#22C55E', '#F59E0B', '#EF4444', '#DC2626']

export default function AdminAnalyticsPage() {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [data, setData] = useState<AnalyticsData | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!token || !user.is_admin) { router.push('/auth/login'); return }
    api.admin.analytics().then(setData).catch(() => router.push('/auth/login'))
  }, [router])

  function handleLogout() {
    localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/auth/login')
  }

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-ts-text/60">Loading analytics...</p></div>
  }

  const riskData = [
    { name: 'Low (0-20)', value: data.risk_distribution.low },
    { name: 'Med (21-50)', value: data.risk_distribution.medium },
    { name: 'High (51-80)', value: data.risk_distribution.high },
    { name: 'Critical (81-100)', value: data.risk_distribution.critical },
  ]

  return (
    <div className="min-h-screen">
      <Sidebar isAdmin collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} onLogout={handleLogout} />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'} p-6`}>
        <Navbar title="Analytics" subtitle="Risk insights & trends" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Risk Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {riskData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-4">Transaction Trends</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.transaction_trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(59,130,246,0.1)" />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="amount" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6' }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={18} className="text-ts-primary" />
              <h2 className="text-lg font-semibold">Login Locations</h2>
            </div>
            <div className="space-y-2">
              {data.login_locations.slice(0, 8).map((loc, i) => (
                <div key={i} className="text-sm flex items-center gap-2 py-1 border-b border-white/5 last:border-0">
                  <span className="text-ts-primary">{loc.city}</span>
                  <span className="text-ts-text/40">{loc.country}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Monitor size={18} className="text-ts-primary" />
              <h2 className="text-lg font-semibold">Device Usage</h2>
            </div>
            <div className="space-y-2">
              {data.device_usage.map((d, i) => (
                <div key={i} className="text-sm py-1 border-b border-white/5 last:border-0">
                  {d.browser?.slice(0, 50) || 'Unknown'}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-ts-danger" />
              <h2 className="text-lg font-semibold">Fraud Attempts</h2>
            </div>
            <p className="text-4xl font-bold text-ts-danger mb-2">{data.fraud_attempts}</p>
            <p className="text-sm text-ts-text/60">Total risk events in last 7 days</p>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
