import { getAdminDb } from '../../utils/firebase-admin'
import type { Meeting } from '~/types/meeting.types'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const snapshot = await (await getAdminDb())
    .collection('meetings')
    .where('hostUid', '==', user.uid)
    .get()

  const meetings = snapshot.docs.map((doc) => {
    const data = doc.data() as Meeting
    const rawCreatedAt = (data as Record<string, any>).createdAt
    return {
      id: doc.id,
      ...data,
      createdAt: typeof rawCreatedAt?.toDate === 'function'
        ? rawCreatedAt.toDate().toISOString()
        : rawCreatedAt ?? null,
    }
  })

  // Sort locally to avoid Firestore composite index requirements
  meetings.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
    return bTime - aTime
  })

  return meetings
})
