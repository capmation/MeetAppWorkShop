import { getAdminDb } from '../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const db = await getAdminDb()
  const snap = await db.collection('projects').where('hostUid', '==', user.uid).get()
  const docs = snap.docs.map(d => d.data() as Record<string, unknown>)
  docs.sort((a, b) => (b.createdAt as string).localeCompare(a.createdAt as string))
  return docs
})
