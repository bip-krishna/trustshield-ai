'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  ArrowRightLeft,
  Shield,
  Activity,
  Users,
  Monitor,
  FileText,
  BarChart3,
  LogOut,
  ChevronLeft,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const userLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
]

const adminLinks = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/devices', label: 'Devices', icon: Monitor },
  { href: '/admin/monitoring', label: 'Monitoring', icon: Activity },
  { href: '/admin/audit', label: 'Audit', icon: FileText },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

interface SidebarProps {
  isAdmin?: boolean
  collapsed?: boolean
  onToggle?: () => void
  onLogout?: () => void
}

export default function Sidebar({ isAdmin, collapsed, onToggle, onLogout }: SidebarProps) {
  const pathname = usePathname()
  const links = isAdmin ? adminLinks : userLinks

  return (
    <motion.aside
      initial={{ width: collapsed ? 72 : 260 }}
      animate={{ width: collapsed ? 72 : 260 }}
      className="fixed left-0 top-0 h-screen z-50 glass"
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 h-16 border-b border-[rgba(59,130,246,0.1)]">
          <ShieldCheck className="text-ts-primary" size={28} />
          {!collapsed && (
            <span className="font-bold text-lg gradient-text">TrustShield</span>
          )}
          <button onClick={onToggle} className="ml-auto p-1 rounded-lg hover:bg-white/5">
            <ChevronLeft size={18} className={cn('transition-transform', collapsed && 'rotate-180')} />
          </button>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link key={link.href} href={link.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer',
                    isActive
                      ? 'bg-ts-primary/10 text-ts-primary border border-ts-primary/20'
                      : 'text-ts-text/60 hover:text-ts-text hover:bg-white/5'
                  )}
                >
                  <Icon size={20} />
                  {!collapsed && <span className="text-sm font-medium">{link.label}</span>}
                </motion.div>
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-[rgba(59,130,246,0.1)]">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-ts-text/60 hover:text-ts-danger hover:bg-ts-danger/10 transition-all"
          >
            <LogOut size={20} />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
