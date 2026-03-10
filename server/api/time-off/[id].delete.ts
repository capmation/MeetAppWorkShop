import { getAdminDb } from '../../utils/firebase-admin'
import { deleteCalendarEvents } from '../../utils/timeoff'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const id = getRouterParam(event, 'id')!
  const db = await getAdminDb()
  const ref = db.collection('timeOffRequests').doc(id)
  const doc = await ref.get()

  if (!doc.exists) throw createError({ statusCode: 404, message: 'Request not found' })
  const data = doc.data()
  if (data?.userUid !== user.uid) throw createError({ statusCode: 403, message: 'Forbidden' })

  await deleteCalendarEvents(db, (data?.eventIds as string[] | undefined) ?? [], user.uid)
  await ref.delete()

  return { success: true }
})
