#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const [, , requestedOutputDirectory] = process.argv

if (!requestedOutputDirectory) {
  console.error('Usage: npm run backup-firestore -- /absolute/path/outside-this-project')
  process.exit(1)
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to your service-account JSON path first.')
  process.exit(1)
}

if (!isAbsolute(requestedOutputDirectory)) {
  console.error('Use an absolute backup directory path outside this project.')
  process.exit(1)
}

const projectDirectory = resolve(process.cwd())
const outputDirectory = resolve(requestedOutputDirectory)
const outputRelativeToProject = relative(projectDirectory, outputDirectory)

if (
  outputRelativeToProject === '' ||
  (!outputRelativeToProject.startsWith(`..${sep}`) && outputRelativeToProject !== '..')
) {
  console.error('Backup refused: choose a directory outside the project repository.')
  process.exit(1)
}

initializeApp({ credential: applicationDefault() })

const database = getFirestore()

function serializeValue(value) {
  if (value === null || value === undefined) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue)
  }

  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      return { __type: 'timestamp', value: value.toDate().toISOString() }
    }

    if (typeof value.path === 'string' && value.firestore) {
      return { __type: 'reference', value: value.path }
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [key, serializeValue(nestedValue)]),
    )
  }

  return value
}

async function exportCollection(collectionReference) {
  const snapshot = await collectionReference.get()

  return Promise.all(
    snapshot.docs.map(async (documentSnapshot) => {
      const subcollections = await documentSnapshot.ref.listCollections()
      const nestedCollections = await Promise.all(
        subcollections.map(async (subcollection) => [
          subcollection.id,
          await exportCollection(subcollection),
        ]),
      )

      return {
        id: documentSnapshot.id,
        data: serializeValue(documentSnapshot.data()),
        collections: Object.fromEntries(nestedCollections),
      }
    }),
  )
}

try {
  const collections = await database.listCollections()
  const exportedCollections = await Promise.all(
    collections.map(async (collectionReference) => [
      collectionReference.id,
      await exportCollection(collectionReference),
    ]),
  )
  const generatedAt = new Date().toISOString()
  const filename = `firestore-backup-${generatedAt.replaceAll(':', '-')}.json`
  const outputPath = resolve(outputDirectory, filename)

  await mkdir(outputDirectory, { recursive: true })
  await writeFile(
    outputPath,
    `${JSON.stringify({ generatedAt, collections: Object.fromEntries(exportedCollections) }, null, 2)}\n`,
    { mode: 0o600 },
  )

  console.log(`Firestore backup created: ${outputPath}`)
} catch (error) {
  console.error('Firestore backup failed:')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
}
