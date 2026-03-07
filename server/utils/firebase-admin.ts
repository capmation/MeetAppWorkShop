function normalizePrivateKey(raw?: string) {
  if (!raw) return undefined
  const unquoted = raw.replace(/^"|"$/g, '') // handle .env quoted strings
  const withNewlines = unquoted.replace(/\\n/g, '\n').trim()
  if (withNewlines.includes('BEGIN PRIVATE KEY')) return withNewlines

  try {
    const decoded = Buffer.from(withNewlines, 'base64').toString('utf8')
    if (decoded.includes('BEGIN PRIVATE KEY')) return decoded.trim()
  }
  catch {
    // fall through to return raw value below
  }

  return withNewlines
}

async function getAdminApp() {
  const { getApps, getApp, initializeApp, cert } = await import('firebase-admin/app')
  if (getApps().length > 0) return getApp()

  const config = useRuntimeConfig()
  const privateKey = normalizePrivateKey(config.firebaseAdminPrivateKey)

  if (!config.firebaseAdminProjectId || !config.firebaseAdminClientEmail || !privateKey) {
    throw new Error('Missing Firebase admin credentials. Check FIREBASE_ADMIN_* env vars.')
  }

  return initializeApp({
    credential: cert({
      projectId: config.firebaseAdminProjectId,
      clientEmail: config.firebaseAdminClientEmail,
      privateKey,
    }),
  })
}

export async function getAdminAuth() {
  const { getAuth } = await import('firebase-admin/auth')
  return getAuth(await getAdminApp())
}

export async function getAdminDb() {
  const { getFirestore } = await import('firebase-admin/firestore')
  return getFirestore(await getAdminApp())
}
