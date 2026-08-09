import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'
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

function buildOrder(lastActivityId = 'seed-activity') {
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
    lastActivityId,
  }
}

function updateTask(tasks: Task[], index: number, changes: Partial<Task>) {
  return tasks.map((task, taskIndex) =>
    taskIndex === index ? { ...task, ...changes } : task,
  )
}

function activityRecord(
  actorUid: string,
  actorName: string,
  actorDept: string,
  action: 'created' | 'updated',
) {
  return {
    actorUid,
    actorName,
    actorDept,
    action,
    summary: action === 'created' ? 'Created test order' : 'Updated test order',
    createdAt: serverTimestamp(),
  }
}

async function commitOrderUpdate(
  database: Firestore,
  changes: Record<string, unknown>,
  activityId: string,
  actor: { uid: string; name: string; dept: string },
) {
  const batch = writeBatch(database)
  batch.update(doc(database, 'orders', ORDER_ID), {
    ...changes,
    lastActivityId: activityId,
  })
  batch.set(
    doc(database, 'orders', ORDER_ID, 'activity', activityId),
    activityRecord(actor.uid, actor.name, actor.dept, 'updated'),
  )
  await batch.commit()
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
      await setDoc(doc(database, 'users', ADMIN_USER_ID), {
        name: 'Admin User',
        email: 'admin@example.com',
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
      commitOrderUpdate(database, {
        tasks: updateTask(order.tasks, 0, {
          assignee: 'Sales User',
          remark: 'Quote approved',
        }),
      }, 'sales-update', { uid: SALES_USER_ID, name: 'Sales User', dept: 'Sales' }),
    )
  })

  test('allows a completed department to activate only the next task', async () => {
    await seedOrderAndProfiles()
    const database = authenticatedDatabase(SALES_USER_ID)
    const order = buildOrder()
    order.tasks = order.tasks.map((task, index) => ({
      ...task,
      status: index === 0 ? 'In Progress' : 'Pending',
    }))

    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'orders', ORDER_ID), order)
    })

    const advancedTasks = updateTask(
      updateTask(order.tasks, 0, { status: 'Completed' }),
      1,
      { status: 'In Progress' },
    )

    await assertSucceeds(
      commitOrderUpdate(
        database,
        { tasks: advancedTasks },
        'sales-completed',
        { uid: SALES_USER_ID, name: 'Sales User', dept: 'Sales' },
      ),
    )
  })

  test('blocks a department from editing details while activating the next task', async () => {
    await seedOrderAndProfiles()
    const database = authenticatedDatabase(SALES_USER_ID)
    const order = buildOrder()
    order.tasks = order.tasks.map((task, index) => ({
      ...task,
      status: index === 0 ? 'In Progress' : 'Pending',
    }))

    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'orders', ORDER_ID), order)
    })

    const tamperedTasks = updateTask(
      updateTask(order.tasks, 0, { status: 'Completed' }),
      1,
      { status: 'In Progress', remark: 'Unauthorized design change' },
    )

    await assertFails(
      commitOrderUpdate(
        database,
        { tasks: tamperedTasks },
        'sales-tampered-next',
        { uid: SALES_USER_ID, name: 'Sales User', dept: 'Sales' },
      ),
    )
  })

  test('blocks a department user from updating another department task', async () => {
    await seedOrderAndProfiles()
    const database = authenticatedDatabase(SALES_USER_ID)
    const order = buildOrder()

    await assertFails(
      commitOrderUpdate(database, {
        tasks: updateTask(order.tasks, 1, { remark: 'Unauthorized design edit' }),
      }, 'design-attack', { uid: SALES_USER_ID, name: 'Sales User', dept: 'Sales' }),
    )
  })

  test('blocks a department user from changing order metadata', async () => {
    await seedOrderAndProfiles()
    const database = authenticatedDatabase(SALES_USER_ID)

    await assertFails(
      commitOrderUpdate(database, {
        deadline: '2027-01-01',
      }, 'metadata-attack', { uid: SALES_USER_ID, name: 'Sales User', dept: 'Sales' }),
    )
  })

  test('blocks order updates that do not include activity history', async () => {
    await seedOrderAndProfiles()
    const database = authenticatedDatabase(SALES_USER_ID)
    const order = buildOrder()

    await assertFails(
      updateDoc(doc(database, 'orders', ORDER_ID), {
        tasks: updateTask(order.tasks, 0, { remark: 'Missing audit record' }),
        lastActivityId: 'missing-activity',
      }),
    )
  })

  test('allows a verified admin to create, update, and delete a valid order', async () => {
    await seedOrderAndProfiles()
    const database = authenticatedDatabase(ADMIN_USER_ID, { admin: true })
    const orderReference = doc(database, 'orders', ORDER_ID)
    const createActivityId = 'admin-create'
    const createBatch = writeBatch(database)

    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await deleteDoc(doc(context.firestore(), 'orders', ORDER_ID))
    })

    createBatch.set(orderReference, buildOrder(createActivityId))
    createBatch.set(
      doc(database, 'orders', ORDER_ID, 'activity', createActivityId),
      activityRecord(ADMIN_USER_ID, 'Admin User', 'Admin', 'created'),
    )

    await assertSucceeds(createBatch.commit())
    await assertSucceeds(
      commitOrderUpdate(
        database,
        { deadline: '2026-10-01' },
        'admin-update',
        { uid: ADMIN_USER_ID, name: 'Admin User', dept: 'Admin' },
      ),
    )
    await assertSucceeds(deleteDoc(orderReference))
  })
})
