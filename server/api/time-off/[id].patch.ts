import { getAdminDb } from '../../utils/firebase-admin'
import {
  createCalendarEventsForRequest,
  deleteCalendarEvents,
  getBusinessDates,
  getMonthKey,
} from '../../utils/timeoff'
import type { TimeOffRequest, TimeOffStatus } from '~/types/timeoff.types'

const MONTHLY_ALLOWANCE = 21

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const status = body?.status as TimeOffStatus | undefined

  if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
    throw createError({ statusCode: 400, message: 'Invalid status' })
  }

  const db = await getAdminDb()
  const ref = db.collection('timeOffRequests').doc(id)
  const doc = await ref.get()

  if (!doc.exists) throw createError({ statusCode: 404, message: 'Request not found' })

  const data = doc.data() as TimeOffRequest
  if (data.userUid !== user.uid) throw createError({ statusCode: 403, message: 'Forbidden' })

  if (data.status === status) return { id, ...data }

  const update: Partial<TimeOffRequest> = { status }

  if (status === 'approved') {
    const monthKey = getMonthKey(data.startDate)
    const approvedSnap = await db.collection('timeOffRequests')
      .where('userUid', '==', user.uid)
      .where('monthKey', '==', monthKey)
      .where('status', '==', 'approved')
      .get()
    const used = approvedSnap.docs
      .filter(d => d.id !== id)
      .reduce((sum, d) => sum + ((d.data().days as number) ?? 0), 0)
    const remaining = Math.max(MONTHLY_ALLOWANCE - used, 0)
    const days = data.days ?? getBusinessDates(data.startDate, data.endDate).length
    if (days > remaining) {
      throw createError({ statusCode: 400, message: `Only ${remaining} days remaining for this month` })
    }

    const eventIds = await createCalendarEventsForRequest(db, { ...data, id }, user)
    update.eventIds = eventIds
    update.approvedAt = new Date().toISOString()
  }
  else {
    await deleteCalendarEvents(db, data.eventIds ?? [], user.uid)
    update.eventIds = []
    update.approvedAt = null
  }

  await ref.update(update)
  return { id, ...data, ...update }
})
