'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { UserRole } from '@/types'

async function checkIsAdmin(email: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, 'config', 'admins'))
    if (!snap.exists()) return false
    const emails = (snap.data().emails as string[]) ?? []
    return emails.map((e) => e.toLowerCase()).includes(email.toLowerCase())
  } catch {
    return false
  }
}

interface AuthContextValue {
  user: User | null
  role: UserRole | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const isAdmin = await checkIsAdmin(firebaseUser.email ?? '')
        const userRole: UserRole = isAdmin ? 'admin' : 'security'
        setRole(userRole)
        document.cookie = `checkin_auth=${userRole}; path=/; SameSite=Strict`
      } else {
        setRole(null)
        document.cookie = 'checkin_auth=; path=/; max-age=0'
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  async function resetPassword(email: string) {
    await sendPasswordResetEmail(auth, email)
  }

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
