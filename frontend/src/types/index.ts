export interface User {
  id: number
  full_name: string
  email: string
  profile_image?: string
  is_active: boolean
  is_admin: boolean
  trust_score: number
  created_at: string
}

export interface LoginHistory {
  id: number
  user_id?: number
  ip_address?: string
  city?: string
  country?: string
  device_name?: string
  risk_score: number
  status: string
  login_time: string
}

export interface Transaction {
  id: number
  recipient: string
  amount: number
  risk_score: number
  status: string
  transaction_time: string
}

export interface Device {
  id: number
  device_name?: string
  browser?: string
  operating_system?: string
  screen_resolution?: string
  is_trusted: boolean
  last_seen: string
}

export interface RiskEvent {
  id: number
  event_type: string
  risk_points: number
  description?: string
  created_at: string
}

export interface DashboardData {
  user: User
  recent_logins: LoginHistory[]
  recent_transactions: Transaction[]
  risk_events: RiskEvent[]
  trusted_devices: Device[]
  trust_score: number
}

export interface MonitoringData {
  active_users: number
  total_users: number
  blocked_users: number
  otp_requests: number
  face_verifications: number
  high_risk_events: number
  recent_logins: LoginHistory[]
}

export interface AnalyticsData {
  risk_distribution: { low: number; medium: number; high: number; critical: number }
  login_locations: { city: string; country: string }[]
  device_usage: { browser: string }[]
  transaction_trends: { date: string; amount: number }[]
  fraud_attempts: number
}
