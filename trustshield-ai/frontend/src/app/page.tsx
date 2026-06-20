'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Shield, ArrowRight, Activity, Fingerprint, Lock, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-3xl p-8 md:p-12 max-w-2xl w-full text-center neon-border"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-ts-primary/10 flex items-center justify-center border border-ts-primary/30"
        >
          <Shield size={40} className="text-ts-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-4xl md:text-5xl font-bold gradient-text mb-3"
        >
          TrustShield AI
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-ts-text/60 text-lg mb-8"
        >
          Identity Trust Engine for Next-Gen Banking Security
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8"
        >
          {[
            { icon: Activity, label: 'Real-time Risk' },
            { icon: Fingerprint, label: 'Face Auth' },
            { icon: Lock, label: 'OTP Secure' },
            { icon: Zap, label: 'AI Powered' },
          ].map((item) => (
            <div key={item.label} className="glass rounded-xl p-3 text-center">
              <item.icon size={20} className="text-ts-primary mx-auto mb-1" />
              <span className="text-xs text-ts-text/60">{item.label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Link href="/auth/login">
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="px-8 py-3 bg-ts-primary text-white rounded-xl font-medium flex items-center gap-2 neon-glow"
            >
              Sign In <ArrowRight size={18} />
            </motion.button>
          </Link>
          <Link href="/auth/register">
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="px-8 py-3 glass rounded-xl font-medium text-ts-text/80 hover:text-ts-text"
            >
              Create Account
            </motion.button>
          </Link>
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-8 text-xs text-ts-text/30"
      >
        Powered by Advanced AI &amp; Machine Learning
      </motion.p>
    </div>
  )
}
