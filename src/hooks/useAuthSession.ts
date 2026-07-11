import { useEffect, useState } from 'react'
import { isFirebaseConfigured } from '../lib/firebase'
import {
  signInWithEmail,
  signOutCurrentUser,
  signUpWithEmail,
  subscribeToAuthChanges,
} from '../services/auth'
import { loadUserProfile } from '../services/users'
import type { ThemeMode, User, UserDepartment } from '../types'
import { mapAuthError } from '../utils/auth'

export function useAuthSession() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authError, setAuthError] = useState<string | null>(
    isFirebaseConfigured ? null : 'Firebase Auth is not configured yet. Add your Firebase env vars first.',
  )
  const [isCheckingAuth, setIsCheckingAuth] = useState(isFirebaseConfigured)
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return
    }

    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null)
        setIsCheckingAuth(false)
        return
      }

      try {
        const profile = await loadUserProfile(firebaseUser)
        setCurrentUser(profile)
        setAuthError(null)
      } catch (error) {
        console.error('Failed to load authenticated user profile:', error)
        setCurrentUser(null)
        setAuthError(mapAuthError(error))
        await signOutCurrentUser()
      } finally {
        setIsCheckingAuth(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const handleLogin = async (email: string, password: string) => {
    try {
      setAuthError(null)
      await signInWithEmail(email, password)
      return null
    } catch (error) {
      return mapAuthError(error)
    }
  }

  const handleSignup = async (payload: {
    name: string
    dept: UserDepartment
    email: string
    password: string
  }) => {
    try {
      setAuthError(null)
      await signUpWithEmail(payload)
      return null
    } catch (error) {
      return mapAuthError(error)
    }
  }

  const handleSignOut = async () => {
    try {
      setAuthError(null)
      await signOutCurrentUser()
      setCurrentUser(null)
    } catch (error) {
      console.error('Failed to sign out:', error)
      setAuthError('Unable to sign out right now. Please try again.')
    }
  }

  return {
    authError,
    currentUser,
    handleLogin,
    handleSignOut,
    handleSignup,
    isCheckingAuth,
    setThemeMode,
    themeMode,
  }
}
