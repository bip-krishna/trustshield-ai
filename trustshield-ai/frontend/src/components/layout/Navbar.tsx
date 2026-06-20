'use client'

import { Shield, Bell } from 'lucide-react'
import { motion } from 'framer-motion'

interface NavbarProps {
  title: string
  subtitle?: string
}

export default function Navbar({ title, subtitle }: NavbarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl px-6 py-4 mb-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold gradient-text">{title}</h1>
          {subtitle && <p className="text-sm text-ts-text/60 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
          >
            <Bell size={18} className="text-ts-text/60" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-ts-danger rounded-full text-[10px] flex items-center justify-center font-bold">
              3
            </span>
          </motion.button>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ts-primary/10 border border-ts-primary/20">
            <Shield size={14} className="text-ts-primary" />
            <span className="text-xs font-medium text-ts-primary">AI Active</span>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
