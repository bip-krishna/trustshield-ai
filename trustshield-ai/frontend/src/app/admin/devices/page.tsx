'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import Navbar from '@/components/layout/Navbar'
import { Trash2, Shield, ShieldOff } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function AdminDevicesPage() {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [devices, setDevices] = useState<any[]>([])

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (!token || !user.is_admin) { router.push('/auth/login'); return }
    api.admin.devices().then(setDevices).catch(() => router.push('/auth/login'))
  }, [router])

  function handleLogout() {
    localStorage.removeItem('token'); localStorage.removeItem('user'); router.push('/auth/login')
  }

  async function toggleTrust(id: number) {
    const res = await api.admin.toggleDeviceTrust(id)
    setDevices(devices.map(d => d.id === id ? { ...d, is_trusted: !d.is_trusted } : d))
    toast.success(res.message)
  }

  async function deleteDevice(id: number) {
    if (!confirm('Delete this device?')) return
    await api.admin.deleteDevice(id)
    setDevices(devices.filter(d => d.id !== id))
    toast.success('Device deleted')
  }

  return (
    <div className="min-h-screen">
      <Sidebar isAdmin collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} onLogout={handleLogout} />
      <main className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-[72px]' : 'ml-[260px]'} p-6`}>
        <Navbar title="Device Management" subtitle="Manage trusted devices" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 text-ts-text/60 font-medium">Device</th>
                <th className="text-left py-3 text-ts-text/60 font-medium">Browser</th>
                <th className="text-left py-3 text-ts-text/60 font-medium">OS</th>
                <th className="text-left py-3 text-ts-text/60 font-medium">User ID</th>
                <th className="text-left py-3 text-ts-text/60 font-medium">Trusted</th>
                <th className="text-left py-3 text-ts-text/60 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {devices.map(device => (
                <tr key={device.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-3">{device.device_name || 'Unknown'}</td>
                  <td className="py-3 text-ts-text/60">{device.browser?.slice(0, 30)}</td>
                  <td className="py-3 text-ts-text/60">{device.operating_system}</td>
                  <td className="py-3">#{device.user_id}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${device.is_trusted ? 'bg-ts-success/10 text-ts-success' : 'bg-ts-text/10 text-ts-text/60'}`}>
                      {device.is_trusted ? 'Trusted' : 'Untrusted'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button onClick={() => toggleTrust(device.id)} className="p-1.5 rounded-lg hover:bg-white/10" title="Toggle trust">
                        {device.is_trusted ? <ShieldOff size={16} className="text-ts-warning" /> : <Shield size={16} className="text-ts-success" />}
                      </button>
                      <button onClick={() => deleteDevice(device.id)} className="p-1.5 rounded-lg hover:bg-white/10" title="Delete">
                        <Trash2 size={16} className="text-ts-danger" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </main>
    </div>
  )
}
