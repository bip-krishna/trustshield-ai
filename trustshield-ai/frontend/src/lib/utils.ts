import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function getRiskColor(score: number) {
  if (score <= 20) return '#22C55E'
  if (score <= 50) return '#F59E0B'
  if (score <= 80) return '#EF4444'
  return '#DC2626'
}

export function getRiskLabel(score: number) {
  if (score <= 20) return 'Low Risk'
  if (score <= 50) return 'Medium Risk'
  if (score <= 80) return 'High Risk'
  return 'Critical Risk'
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'allowed': return '#22C55E'
    case 'otp_required': return '#F59E0B'
    case 'face_required': return '#EF4444'
    case 'blocked': return '#DC2626'
    default: return '#64748B'
  }
}

export function getStatusLabel(status: string) {
  switch (status) {
    case 'allowed': return 'Allowed'
    case 'otp_required': return 'OTP Required'
    case 'face_required': return 'Face Verify'
    case 'blocked': return 'Blocked'
    default: return 'Pending'
  }
}
