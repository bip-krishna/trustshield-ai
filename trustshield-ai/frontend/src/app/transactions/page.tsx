'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import { ArrowRightLeft, Send, Loader2, Shield, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { formatDate, getRiskColor, getStatusColor, getStatusLabel } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Transaction as TransactionType } from '@/types'

export default function TransactionsPage() {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [transactions, setTransactions] = useState<TransactionType[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ recipient: '', amount: '' })
  const [result, setResult] = useState<{ risk_score: number; risk_status: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { router.push('/auth/login'); return }
    api.transactions.history()
      .then(setTransactions)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [router])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/auth/login')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)

    try {
      const fingerprint = btoa(`${navigator.userAgent}|${navigator.platform}|${screen.width}x${screen.height}|${navigator.language}`)
      const res = await api.transactions.create({
        recipient: form.recipient,
        amount: parseFloat(form.amount),
        device_data: {
          device_fingerprint: fingerprint,
          device_name: navigator.userAgent.split('/')[0],
          browser: navigator.userAgent,
          operating_system: navigator.platform,
          screen_resolution: `${screen.width}x${screen.height}`,
        },
      })

      setResult({ risk_score: res.risk_score, risk_status: res.risk_status })

      if (res.risk_status === 'allowed') {
        toast.success('Transaction approved!')
        setForm({ recipient: '', amount: '' })
        api.transactions.history().then(setTransactions)
      } else if (res.risk_status === 'otp_required') {
        toast('OTP verification needed', { icon: '🔑' })
      } else if (res.risk_status === 'face_required') {
        toast('Face verification needed', { icon: '👤' })
      } else {
        toast.error('Transaction blocked due to high risk')
      }
    } catch (err: any) {
      toast.error(err.message || 'Transaction failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} onLogout={handleLogout} />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'} p-6`}>
        <Navbar title="Transactions" subtitle="Send money securely" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4">New Transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ts-text/80 mb-1.5">Recipient</label>
                <input
                  type="text"
                  placeholder="Account name or ID"
                  className="w-full"
                  value={form.recipient}
                  onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ts-text/80 mb-1.5">Amount ($)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.01"
                  className="w-full"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.01 }}
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-ts-primary text-white rounded-xl font-medium flex items-center justify-center gap-2 neon-glow disabled:opacity-50"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                {submitting ? 'Processing...' : 'Send Payment'}
              </motion.button>
            </form>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 rounded-xl"
                style={{ background: `${getRiskColor(result.risk_score)}10` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {result.risk_status === 'blocked' ? (
                    <AlertTriangle size={16} className="text-ts-danger" />
                  ) : (
                    <Shield size={16} className="text-ts-success" />
                  )}
                  <span className="text-sm font-medium">Risk Score: {Math.round(result.risk_score)}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{
                  background: `${getStatusColor(result.risk_status)}20`,
                  color: getStatusColor(result.risk_status),
                }}>
                  {getStatusLabel(result.risk_status)}
                </span>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4">Transaction History</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5">
                  <div className="flex items-center gap-3">
                    <ArrowRightLeft size={16} className="text-ts-text/40" />
                    <div>
                      <p className="text-sm font-medium">{tx.recipient}</p>
                      <p className="text-xs text-ts-text/40">{formatDate(tx.transaction_time)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${tx.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xs" style={{ color: getRiskColor(tx.risk_score) }}>
                        {Math.round(tx.risk_score)}
                      </span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{
                        background: `${getStatusColor(tx.status)}20`,
                        color: getStatusColor(tx.status),
                      }}>
                        {getStatusLabel(tx.status)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {transactions.length === 0 && (
                <p className="text-sm text-ts-text/40 text-center py-8">No transactions yet</p>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
