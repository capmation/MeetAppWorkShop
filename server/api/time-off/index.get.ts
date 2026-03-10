import { getAdminDb } from '../../utils/firebase-admin'
import { normalizeDate } from '../../utils/timeoff'
import type { TimeOffRequest } from '~/types/timeoff.types'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const month = getQuery(event).month as string | undefined
  const db = await getAdminDb()

  let query = db.collection('timeOffRequests').where('userUid', '==', user.uid)
  if (month) {
    query = query.where('monthKey', '==', month)
  }

  const snap = await query.get()
  const requests = snap.docs.map(d => ({ id: d.id, ...d.data() } as TimeOffRequest))
  requests.sort((a, b) => b.startDate.localeCompare(a.startDate))

  // Normalize dates on the way out (avoid timezone drift)
  return requests.map(r => ({ ...r, startDate: normalizeDate(r.startDate), endDate: normalizeDate(r.endDate) }))
})
