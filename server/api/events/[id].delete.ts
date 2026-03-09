import { getAdminDb } from '../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const id = getRouterParam(event, 'id')!
  const db = await getAdminDb()
  const ref = db.collection('events').doc(id)
  const doc = await ref.get()

  if (!doc.exists) throw createError({ statusCode: 404, message: 'Event not found' })
  if (doc.data()?.hostUid !== user.uid) throw createError({ statusCode: 403, message: 'Forbidden' })

  await ref.delete()
  return { success: true }
})
