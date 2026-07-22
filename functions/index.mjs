import { createHmac, timingSafeEqual } from 'node:crypto'
import nodemailer from 'nodemailer'
import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { onRequest } from 'firebase-functions/v2/https'

initializeApp()

const db = getFirestore()
const auth = getAuth()

function requireEnv(name) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function createApprovalSignature(requestId) {
  const secret = requireEnv('ADMIN_APPROVAL_SECRET')
  return createHmac('sha256', secret).update(requestId).digest('hex')
}

function verifyApprovalSignature(requestId, signature) {
  const expected = Buffer.from(createApprovalSignature(requestId))
  const received = Buffer.from(signature ?? '')

  return expected.length === received.length && timingSafeEqual(expected, received)
}

function getTransporter() {
  return nodemailer.createTransport({
    host: requireEnv('SMTP_HOST'),
    port: Number(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: requireEnv('SMTP_USER'),
      pass: requireEnv('SMTP_PASS'),
    },
  })
}

export const notifyAdminRequestCreated = onDocumentCreated(
  'adminRequests/{requestId}',
  async (event) => {
    const request = event.data?.data()

    if (!request || request.status !== 'pending') {
      return
    }

    const requestId = event.params.requestId
    const approvalBaseUrl = requireEnv('APPROVAL_BASE_URL')
    const adminEmail = requireEnv('MAIN_ADMIN_EMAIL')
    const signature = createApprovalSignature(requestId)
    const approvalUrl = `${approvalBaseUrl}?requestId=${requestId}&signature=${signature}`
    const transporter = getTransporter()

    await transporter.sendMail({
      to: adminEmail,
      from: requireEnv('SMTP_FROM'),
      subject: 'Admin access request approval',
      text: [
        `${request.requesterName} (${request.requesterEmail}) requested admin access.`,
        `Current department: ${request.requesterDept}`,
        '',
        `Approve here: ${approvalUrl}`,
      ].join('\n'),
    })
  },
)

export const approveAdminRequest = onRequest(async (request, response) => {
  const requestId = String(request.query.requestId ?? '')
  const signature = String(request.query.signature ?? '')

  if (!requestId || !signature || !verifyApprovalSignature(requestId, signature)) {
    response.status(403).send('Invalid approval link.')
    return
  }

  const requestRef = db.collection('adminRequests').doc(requestId)
  const requestSnapshot = await requestRef.get()

  if (!requestSnapshot.exists) {
    response.status(404).send('Admin request not found.')
    return
  }

  const data = requestSnapshot.data()

  if (!data || data.status !== 'pending') {
    response.status(409).send('This admin request has already been handled.')
    return
  }

  await auth.setCustomUserClaims(data.requesterUid, {
    admin: true,
  })

  await db.collection('users').doc(data.requesterUid).set(
    {
      dept: 'Admin',
    },
    { merge: true },
  )

  await requestRef.update({
    status: 'approved',
    approvedAt: new Date().toISOString(),
    approvedBy: requireEnv('MAIN_ADMIN_EMAIL'),
  })

  response.status(200).send(
    `Admin access approved for ${data.requesterName}. Ask them to sign out and sign back in.`,
  )
})
