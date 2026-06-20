import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * A-01: Reusable hook for admin page authentication guard.
 * Replaces duplicated auth check logic across 6+ admin pages.
 * Returns true once auth is verified, false while checking.
 */
export function useAdminAuth() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    let user = { is_admin: false }
    try {
      user = JSON.parse(
        typeof window !== 'undefined' ? localStorage.getItem('user') || '{}' : '{}'
      )
    } catch {
      // Invalid JSON in localStorage
    }

    if (!token || !user.is_admin) {
      router.push('/auth/login')
      return
    }

    setAuthenticated(true)
  }, [router])

  return authenticated
}

/**
 * Shared logout handler for pages that store auth in localStorage.
 */
export function useLogout() {
  const router = useRouter()
  return () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    router.push('/auth/login')
  }
}
