import { useEffect, useState } from 'react'
import type { User as FirebaseAuthUser } from 'firebase/auth'
import { isFirebaseConfigured } from '../lib/firebase'
import {
  reloadCurrentAuthUser,
  sendCurrentUserVerificationEmail,
  sendPasswordResetLink,
  signInWithEmail,
  signOutCurrentUser,
  signUpWithEmail,
  subscribeToAuthChanges,
} from '../services/auth'
import { loadUserProfile } from '../services/users'
import type { ThemeMode, User, UserDepartment } from '../types'
import { mapAuthError } from '../utils/auth'
import { AUTH_COPY } from '../data/authCopy'

export function useAuthSession() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [authError, setAuthError] = useState<string | null>(
    isFirebaseConfigured ? null : 'Firebase Auth is not configured yet. Add your Firebase env vars first.',
  )
  const [authMessage, setAuthMessage] = useState<string | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(isFirebaseConfigured)
  const [isRefreshingVerification, setIsRefreshingVerification] = useState(false)
  const [isSendingVerification, setIsSendingVerification] = useState(false)
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null)
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')

  const syncCurrentUser = async (firebaseUser: FirebaseAuthUser) => {
    const profile = await loadUserProfile(firebaseUser)
    setCurrentUser(profile)
    setPendingVerificationEmail(null)
    setAuthError(null)
  }

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

      if (!firebaseUser.emailVerified) {
        setCurrentUser(null)
        setPendingVerificationEmail(firebaseUser.email ?? '')
        setAuthError(null)
        setAuthMessage(AUTH_COPY.emailVerificationPending)
        setIsCheckingAuth(false)
        return
      }

      try {
        await syncCurrentUser(firebaseUser)
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
      setAuthMessage(null)
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
      setAuthMessage(AUTH_COPY.emailVerificationSent)
      await signUpWithEmail(payload)
      return null
    } catch (error) {
      setAuthMessage(null)
      return mapAuthError(error)
    }
  }

  const handlePasswordReset = async (email: string) => {
    try {
      setAuthError(null)
      setAuthMessage(AUTH_COPY.passwordResetSent)
      await sendPasswordResetLink(email)
      return null
    } catch (error) {
      setAuthMessage(null)
      return mapAuthError(error)
    }
  }

  const handleSignOut = async () => {
    try {
      setAuthError(null)
      setAuthMessage(null)
      await signOutCurrentUser()
      setCurrentUser(null)
      setPendingVerificationEmail(null)
    } catch (error) {
      console.error('Failed to sign out:', error)
      setAuthError('Unable to sign out right now. Please try again.')
    }
  }

  const handleSendVerificationEmail = async () => {
    try {
      setAuthError(null)
      setIsSendingVerification(true)
      await sendCurrentUserVerificationEmail()
      setAuthMessage(AUTH_COPY.emailVerificationSent)
      return null
    } catch (error) {
      return mapAuthError(error)
    } finally {
      setIsSendingVerification(false)
    }
  }

  const handleRefreshVerification = async () => {
    try {
      setAuthError(null)
      setIsRefreshingVerification(true)
      const firebaseUser = await reloadCurrentAuthUser()

      if (!firebaseUser.emailVerified) {
        setPendingVerificationEmail(firebaseUser.email ?? '')
        setAuthMessage(AUTH_COPY.emailVerificationRefreshPending)
        return null
      }

      await syncCurrentUser(firebaseUser)
      setAuthMessage(AUTH_COPY.emailVerificationRefreshSuccess)
      return null
    } catch (error) {
      return mapAuthError(error)
    } finally {
      setIsRefreshingVerification(false)
    }
  }

  return {
    authError,
    authMessage,
    currentUser,
    handleLogin,
    handlePasswordReset,
    handleRefreshVerification,
    handleSendVerificationEmail,
    handleSignOut,
    handleSignup,
    isCheckingAuth,
    isRefreshingVerification,
    isSendingVerification,
    pendingVerificationEmail,
    setThemeMode,
    themeMode,
  }
}
