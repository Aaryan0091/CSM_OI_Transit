import { addDoc, collection, getDocs, limit, query, where } from 'firebase/firestore/lite'
import { db } from '../lib/firebase'
import type { AdminRequest, Department, User } from '../types'

type AdminRequestRecord = Omit<AdminRequest, 'id'>

function toAdminRequest(recordId: string, data: AdminRequestRecord): AdminRequest {
  return {
    id: recordId,
    ...data,
  }
}

export async function getPendingAdminRequestForUser(userId: string) {
  if (!db) {
    return null
  }

  const snapshot = await getDocs(
    query(
      collection(db, 'adminRequests'),
      where('requesterUid', '==', userId),
      where('status', '==', 'pending'),
      limit(1),
    ),
  )

  const match = snapshot.docs[0]

  if (!match) {
    return null
  }

  return toAdminRequest(match.id, match.data() as AdminRequestRecord)
}

export async function createAdminRequest(user: User) {
  if (!db) {
    throw new Error('Database is not configured.')
  }

  if (user.dept === 'Admin') {
    throw new Error('This account already has admin access.')
  }

  const existingRequest = await getPendingAdminRequestForUser(user.uid)

  if (existingRequest) {
    return existingRequest
  }

  const requestData: AdminRequestRecord = {
    requesterUid: user.uid,
    requesterEmail: user.email,
    requesterName: user.name,
    requesterDept: user.dept as Department,
    status: 'pending',
    createdAt: new Date().toISOString(),
    approvedAt: null,
    approvedBy: null,
  }

  const created = await addDoc(collection(db, 'adminRequests'), requestData)

  return toAdminRequest(created.id, requestData)
}
