import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseAuthUser,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore/lite'
import { auth, db } from '../lib/firebase'
import type { UserDepartment } from '../types'

export function subscribeToAuthChanges(
  callback: (firebaseUser: FirebaseAuthUser | null) => void | Promise<void>,
) {
  if (!auth) {
    return () => {}
  }

  return onAuthStateChanged(auth, callback)
}

export async function signInWithEmail(email: string, password: string) {
  if (!auth) {
    throw new Error('Firebase Auth is not configured yet.')
  }

  await signInWithEmailAndPassword(auth, email, password)
}

export async function signUpWithEmail(payload: {
  name: string
  dept: UserDepartment
  email: string
  password: string
}) {
  if (!auth || !db) {
    throw new Error('Firebase Auth is not configured yet.')
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    payload.email,
    payload.password,
  )

  try {
    await setDoc(doc(db, 'users', credential.user.uid), {
      name: payload.name,
      dept: payload.dept,
      email: payload.email,
    })
  } catch (error) {
    let rollbackSucceeded = false

    try {
      await deleteUser(credential.user)
      rollbackSucceeded = true
    } catch (cleanupError) {
      console.error('Failed to roll back auth user after profile creation failed:', cleanupError)
    }

    if (rollbackSucceeded) {
      throw new Error('Account setup could not be completed. Please try signing up again.', {
        cause: error,
      })
    }

    throw new Error(
      'Your auth account was created, but profile setup failed. Please contact support before trying to sign in.',
      { cause: error },
    )
  }
}

export async function signOutCurrentUser() {
  if (!auth) {
    return
  }

  await signOut(auth)
}
