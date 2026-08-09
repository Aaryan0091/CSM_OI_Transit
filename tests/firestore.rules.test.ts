import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { afterAll, afterEach, beforeAll, describe, test } from 'vitest'

const PROJECT_ID = 'csm-order-tracker-rules-test'
const SALES_USER_ID = 'sales-user'
const ADMIN_USER_ID = 'admin-user'
const ORDER_ID = 'ORD-100'

type Task = {
  dept: string
  status: string
  assignee: string
  remark: string
  nextDeptRemark: string
  nextDeptRemarkTarget: string
  holdReason: string
}

const departments = ['Sales', 'Design', 'Procurement', 'Production', 'QC', 'Dispatch']

function buildOrder() {
  return {
    id: ORDER_ID,
    company: 'CSM',
    client: 'Test Client',
    product: 'Test Product',
    description: 'Test order',
    deadline: '2026-09-01',
    priority: 'Medium',
    overallStatus: 'In Progress',
    tasks: departments.map((dept) => ({
      dept,
      status: 'In Progress',
      assignee: '',
      remark: '',
      nextDeptRemark: '',
      nextDeptRemarkTarget: '',
      holdReason: '',
    })),
    createdAt: '2026-08-09',
  }
}

function updateTask(tasks: Task[], index: number, changes: Partial<Task>) {
  return tasks.map((task, taskIndex) =>
    taskIndex === index ? { ...task, ...changes } : task,
  )
}

describe('Firestore security rules', () => {
  let testEnvironment: RulesTestEnvironment

  beforeAll(async () => {
    testEnvironment = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        host: '127.0.0.1',
        port: 8080,
        rules: readFileSync(resolve('firestore.rules'), 'utf8'),
      },
    })
  })

  afterEach(async () => {
    if (testEnvironment) {
      await testEnvironment.clearFirestore()
    }
  })

  afterAll(async () => {
    if (testEnvironment) {
      await testEnvironment.cleanup()
    }
  })

  async function seedOrderAndProfiles() {
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const database = context.firestore()

      await setDoc(doc(database, 'orders', ORDER_ID), buildOrder())
      await setDoc(doc(database, 'users', SALES_USER_ID), {
        name: 'Sales User',
        email: 'sales@example.com',
        dept: 'Sales',
      })
    })
  }

  function authenticatedDatabase(
    uid: string,
    options: { admin?: boolean; emailVerified?: boolean } = {},
  ) {
    return testEnvironment.authenticatedContext(uid, {
      email: `${uid}@example.com`,
      email_verified: options.emailVerified ?? true,
      admin: options.admin ?? false,
    }).firestore()
  }

  test('blocks unverified users from reading orders', async () => {
    await seedOrderAndProfiles()
    const database = authenticatedDatabase(SALES_USER_ID, { emailVerified: false })

    await assertFails(getDoc(doc(database, 'orders', ORDER_ID)))
  })

  test('allows verified users to read orders', async () => {
    await seedOrderAndProfiles()
    const database = authenticatedDatabase(SALES_USER_ID)

    await assertSucceeds(getDoc(doc(database, 'orders', ORDER_ID)))
  })

  test('allows a department user to update only their own task', async () => {
    await seedOrderAndProfiles()
    const database = authenticatedDatabase(SALES_USER_ID)
    const order = buildOrder()

    await assertSucceeds(
      updateDoc(doc(database, 'orders', ORDER_ID), {
        tasks: updateTask(order.tasks, 0, {
          assignee: 'Sales User',
          remark: 'Quote approved',
        }),
      }),
    )
  })

  test('blocks a department user from updating another department task', async () => {
    await seedOrderAndProfiles()
    const database = authenticatedDatabase(SALES_USER_ID)
    const order = buildOrder()

    await assertFails(
      updateDoc(doc(database, 'orders', ORDER_ID), {
        tasks: updateTask(order.tasks, 1, { remark: 'Unauthorized design edit' }),
      }),
    )
  })

  test('blocks a department user from changing order metadata', async () => {
    await seedOrderAndProfiles()
    const database = authenticatedDatabase(SALES_USER_ID)

    await assertFails(
      updateDoc(doc(database, 'orders', ORDER_ID), {
        deadline: '2027-01-01',
      }),
    )
  })

  test('allows a verified admin to create, update, and delete a valid order', async () => {
    const database = authenticatedDatabase(ADMIN_USER_ID, { admin: true })
    const orderReference = doc(database, 'orders', ORDER_ID)

    await assertSucceeds(setDoc(orderReference, buildOrder()))
    await assertSucceeds(updateDoc(orderReference, { deadline: '2026-10-01' }))
    await assertSucceeds(deleteDoc(orderReference))
  })
})
