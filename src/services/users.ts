import type { User as FirebaseAuthUser } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore/lite'
import { db } from '../lib/firebase'
import type { User } from '../types'
import { isUserDepartment } from '../utils/orders'

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

  if (!profile.name || !isUserDepartment(profile.dept)) {
    throw new Error('User profile is missing required role details.')
  }

  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? profile.email ?? '',
    name: profile.name,
    dept: profile.dept,
  }
}
