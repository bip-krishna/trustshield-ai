'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Shield, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  function generateDeviceFingerprint() {
    const ua = navigator.userAgent
    const platform = navigator.platform
    const screenRes = `${window.screen.width}x${window.screen.height}`
    const lang = navigator.language
    return btoa(`${ua}|${platform}|${screenRes}|${lang}`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const deviceData = {
        device_name: navigator.userAgent.split('/')[0],
        browser: navigator.userAgent,
        operating_system: navigator.platform,
        screen_resolution: `${screen.width}x${screen.height}`,
        device_fingerprint: generateDeviceFingerprint(),
      }

      const res = await api.auth.login({ ...form, device_data: deviceData })

      if (res.access_token) {
        localStorage.setItem('token', res.access_token)
        localStorage.setItem('user', JSON.stringify(res.user))
        toast.success('Login successful!')
        if (res.user.is_admin) {
          router.push('/admin')
        } else {
          router.push('/dashboard')
        }
      } else if (res.risk_status === 'otp_required') {
        localStorage.setItem('pending_email', form.email)
        router.push(`/auth/otp?email=${encodeURIComponent(form.email)}`)
      } else if (res.risk_status === 'face_required') {
        localStorage.setItem('pending_email', form.email)
        router.push(`/auth/face-verify?email=${encodeURIComponent(form.email)}`)
      } else {
        toast.error(res.detail?.message || 'Login blocked')
      }
    } catch (err: any) {
      const msg = err.message
      if (typeof msg === 'object' && msg?.message) {
        toast.error(msg.message)
      } else if (msg?.includes('blocked')) {
        toast.error('Access blocked due to high risk activity')
      } else {
        toast.error(msg || 'Login failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 w-full max-w-md neon-border"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-ts-primary/10 flex items-center justify-center border border-ts-primary/30">
            <Shield size={32} className="text-ts-primary" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">Welcome Back</h1>
          <p className="text-ts-text/60 text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ts-text/80 mb-1.5">Email</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ts-text/40" />
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full pl-10"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ts-text/80 mb-1.5">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ts-text/40" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full pl-10 pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ts-text/40 hover:text-ts-text"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-ts-primary text-white rounded-xl font-medium flex items-center justify-center gap-2 neon-glow disabled:opacity-50"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
            {loading ? 'Analyzing...' : 'Sign In'}
          </motion.button>
        </form>

        <p className="text-center text-sm text-ts-text/40 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-ts-primary hover:underline">Register</Link>
        </p>
      </motion.div>
    </div>
  )
}
