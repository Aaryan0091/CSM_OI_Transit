import type { User as FirebaseAuthUser } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore/lite'
import { db } from '../lib/firebase'
import type { Department, User } from '../types'
import { isUserDepartment } from '../utils/orders'

function isDepartment(value: unknown): value is Department {
  return value !== 'Admin' && isUserDepartment(value)
}

export async function loadUserProfile(firebaseUser: FirebaseAuthUser): Promise<User> {
  if (!db) {
    throw new Error('Database is not configured.')
  }

  const profileSnapshot = await getDoc(doc(db, 'users', firebaseUser.uid))

  if (!profileSnapshot.exists()) {
    throw new Error('No user profile found for this account.')
  }

  const profile = profileSnapshot.data() as Partial<Pick<User, 'name' | 'dept'>> & {
    email?: string
  }
  const tokenResult = await firebaseUser.getIdTokenResult()
  const isAdmin = tokenResult.claims.admin === true

  if (!profile.name || !isUserDepartment(profile.dept)) {
    throw new Error('User profile is missing required role details.')
  }

  if (!isAdmin && !isDepartment(profile.dept)) {
    throw new Error('Admin access must be granted through Firebase custom claims.')
  }

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? profile.email ?? '',
    emailVerified: firebaseUser.emailVerified,
    name: profile.name,
    dept: isAdmin ? 'Admin' : profile.dept,
  }
}
