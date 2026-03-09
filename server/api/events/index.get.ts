import { getAdminDb } from '../../utils/firebase-admin'
import type { CalendarEvent } from '~/types/event.types'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const query = getQuery(event)
  const from = query.from as string | undefined
  const to = query.to as string | undefined

  const db = await getAdminDb()
  const snapshot = await db.collection('events').where('hostUid', '==', user.uid).get()

  let events = snapshot.docs.map((doc) => {
    return { id: doc.id, ...doc.data() } as CalendarEvent
  })

  // Filter by range in memory (avoids composite index)
  if (from) events = events.filter(e => e.startAt >= from)
  if (to) events = events.filter(e => e.startAt <= to)

  events.sort((a, b) => a.startAt.localeCompare(b.startAt))

  return events
})
