'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import { FileText } from 'lucide-react'
import { api } from '@/lib/api'

export default function AdminAuditPage() {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [logs, setLogs] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!token || !user.is_admin) { router.push('/auth/login'); return }
    api.admin.audit().then(setLogs).catch(() => router.push('/auth/login'))
  }, [router])

  function handleLogout() {
    localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/auth/login')
  }

  return (
    <div className="min-h-screen">
      <Sidebar isAdmin collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} onLogout={handleLogout} />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'} p-6`}>
        <Navbar title="Audit Center" subtitle="Track all system activities" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 text-ts-text/60 font-medium">ID</th>
                <th className="text-left py-3 text-ts-text/60 font-medium">Action</th>
                <th className="text-left py-3 text-ts-text/60 font-medium">Admin ID</th>
                <th className="text-left py-3 text-ts-text/60 font-medium">Target User</th>
                <th className="text-left py-3 text-ts-text/60 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3 text-ts-text/60">#{log.id}</td>
                  <td className="py-3">{log.action}</td>
                  <td className="py-3 text-ts-text/60">#{log.admin_id}</td>
                  <td className="py-3 text-ts-text/60">{log.target_user ? `#${log.target_user}` : '-'}</td>
                  <td className="py-3 text-ts-text/60">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-ts-text/40">No audit logs found</td></tr>
              )}
            </tbody>
          </table>
        </motion.div>
      </main>
    </div>
  )
}
