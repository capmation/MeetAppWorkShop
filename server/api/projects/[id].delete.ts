import { getAdminDb } from '../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const id = getRouterParam(event, 'id')!
  const db = await getAdminDb()
  const doc = await db.collection('projects').doc(id).get()
  if (!doc.exists) throw createError({ statusCode: 404, message: 'Not found' })
  if (doc.data()!.hostUid !== user.uid) throw createError({ statusCode: 403, message: 'Forbidden' })

  await db.collection('projects').doc(id).delete()
  return { ok: true }
})
