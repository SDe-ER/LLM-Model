'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'PROJECT_MANAGER' | 'SITE_SUPERVISOR' | 'ACCOUNTANT' | 'HR_OFFICER'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  tenantId: string
  tenantName: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, tenantId?: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const STORAGE_KEY = 'heavyops_auth'
const SESSION_HOURS = 8

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          setUser(parsed.user)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, _password: string, _tenantId?: string) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockUser: User = {
      id: 'usr_1',
      email,
      name: 'Ahmed Al-Rashid',
      role: 'TENANT_ADMIN',
      tenantId: 'tn_1',
      tenantName: 'Al-Rashid Construction Co.'
    }
    
    const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: mockUser, expiresAt }))
    setUser(mockUser)
    setIsLoading(false)
  }

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
