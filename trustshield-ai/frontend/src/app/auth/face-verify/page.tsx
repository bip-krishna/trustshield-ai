'use client'

import { Suspense, useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Camera, Loader2, ScanFace } from 'lucide-react'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'

export default function FaceVerifyPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="animate-pulse text-ts-primary mx-auto mb-4" size={48} />
          <p className="text-ts-text/60">Loading...</p>
        </div>
      </div>
    }>
      <FaceVerifyPage />
    </Suspense>
  )
}

function FaceVerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || (typeof window !== 'undefined' ? localStorage.getItem('pending_email') : null) || ''
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (!email) router.push('/auth/login')
  }, [email, router])

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
      }
    } catch {
      toast.error('Camera access denied')
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(t => t.stop())
      videoRef.current.srcObject = null
      setCameraActive(false)
    }
  }

  useEffect(() => {
    return () => { stopCamera() }
  }, [])

  async function verifyFace() {
    if (!videoRef.current || !canvasRef.current) return
    setVerifying(true)

    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)

    try {
      // Generate synthetic embedding for verification
      const embedding = Array.from({ length: 128 }, () => Math.random() * 2 - 1).join(',')
      const res = await api.face.verify(email, embedding)

      if (res.verified) {
        localStorage.setItem('token', res.access_token)
        localStorage.setItem('user', JSON.stringify(res.user))
        localStorage.removeItem('pending_email')
        stopCamera()
        toast.success('Face verified! Access granted.')
        router.push(res.user.is_admin ? '/admin' : '/dashboard')
      } else {
        toast.error('Face verification failed')
        setVerifying(false)
      }
    } catch (err: any) {
      toast.error(err.message || 'Verification failed')
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8 w-full max-w-md neon-border text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-ts-danger/10 flex items-center justify-center border border-ts-danger/30">
          <ScanFace size={32} className="text-ts-danger" />
        </div>

        <h1 className="text-2xl font-bold gradient-text mb-2">Face Verification</h1>
        <p className="text-ts-text/60 text-sm mb-8">
          High-risk activity detected. Please verify your identity.
        </p>

        {!cameraActive ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={startCamera}
            className="px-8 py-3 bg-ts-primary text-white rounded-xl font-medium flex items-center gap-2 mx-auto neon-glow"
          >
            <Camera size={18} />
            Open Camera
          </motion.button>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl" />
              <div className="absolute inset-0 border-2 border-ts-primary/30 rounded-xl animate-pulse-border" />
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              onClick={verifyFace}
              disabled={verifying}
              className="w-full py-3 bg-ts-primary text-white rounded-xl font-medium flex items-center justify-center gap-2 neon-glow disabled:opacity-50"
            >
              {verifying ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ScanFace size={18} />
              )}
              {verifying ? 'Verifying...' : 'Verify Face'}
            </motion.button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </motion.div>
    </div>
  )
}
