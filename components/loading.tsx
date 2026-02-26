'use client'

import { ReactNode } from 'react'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg'
}

export function Loading({ size = 'md' }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }

  return (
    <div 
      className={`animate-spin rounded-full border-2 border-blue-600 ${sizeClasses[size]}`} 
    />
  )
}

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 0-0 0-12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loading size="lg" />
    </div>
  )
}

export function ErrorBoundary({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return null
}
