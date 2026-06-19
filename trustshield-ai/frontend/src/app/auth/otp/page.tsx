'use client'

import { Suspense, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, KeyRound, Loader2, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function OTPPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="animate-pulse text-ts-primary mx-auto mb-4" size={48} />
          <p className="text-ts-text/60">Loading...</p>
        </div>
      </div>
    }>
      <OTPPage />
    </Suspense>
  )
}

function OTPPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || (typeof window !== 'undefined' ? localStorage.getItem('pending_email') : null) || ''
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [timer, setTimer] = useState(300)

  useEffect(() => {
    if (!email) router.push('/auth/login')
    api.otp.send(email).catch(() => {})
  }, [email, router])

  useEffect(() => {
    if (timer <= 0) return
    const interval = setInterval(() => setTimer(t => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timer])

  async function handleVerify() {
    const code = otp.join('')
    if (code.length !== 6) {
      toast.error('Enter complete OTP')
      return
    }
    setLoading(true)

    try {
      const res = await api.otp.verify(email, code)
      if (res.access_token) {
        localStorage.setItem('token', res.access_token)
        localStorage.setItem('user', JSON.stringify(res.user))
        localStorage.removeItem('pending_email')
        toast.success('Verified successfully!')
        router.push(res.user.is_admin ? '/admin' : '/dashboard')
      }
    } catch (err: any) {
      toast.error(err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    setResending(true)
    try {
      await api.otp.resend(email)
      setTimer(300)
      toast.success('OTP resent')
    } catch {
      toast.error('Failed to resend')
    } finally {
      setResending(false)
    }
  }

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`)
      next?.focus()
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`)
      prev?.focus()
    }
  }

  const minutes = Math.floor(timer / 60)
  const seconds = timer % 60

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 w-full max-w-md neon-border text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-ts-warning/10 flex items-center justify-center border border-ts-warning/30">
          <KeyRound size={32} className="text-ts-warning" />
        </div>

        <h1 className="text-2xl font-bold gradient-text mb-2">OTP Verification</h1>
        <p className="text-ts-text/60 text-sm mb-2">
          Enter the code sent to {email}
        </p>
        <p className="text-ts-text/40 text-xs mb-8">
          Expires in {minutes}:{seconds.toString().padStart(2, '0')}
        </p>

        <div className="flex justify-center gap-3 mb-8">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-xl font-bold rounded-xl glass animate-pulse-border"
              style={{ caretColor: '#3B82F6' }}
            />
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          onClick={handleVerify}
          disabled={loading || otp.join('').length !== 6}
          className="w-full py-3 bg-ts-primary text-white rounded-xl font-medium flex items-center justify-center gap-2 neon-glow disabled:opacity-50 mb-4"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
          {loading ? 'Verifying...' : 'Verify OTP'}
        </motion.button>

        <button
          onClick={handleResend}
          disabled={resending || timer > 0}
          className="text-ts-primary text-sm hover:underline disabled:text-ts-text/30 flex items-center justify-center gap-1 mx-auto"
        >
          <RefreshCw size={14} className={resending ? 'animate-spin' : ''} />
          {resending ? 'Resending...' : timer > 0 ? `Resend in ${minutes}:${seconds.toString().padStart(2, '0')}` : 'Resend OTP'}
        </button>
      </motion.div>
    </div>
  )
}
