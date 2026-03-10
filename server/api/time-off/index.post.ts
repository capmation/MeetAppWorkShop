import { getAdminDb } from '../../utils/firebase-admin'
import {
  assertDate,
  getBusinessDates,
  getMonthKey,
  isShortNotice,
  normalizeDate,
} from '../../utils/timeoff'
import type { TimeOffRequest } from '~/types/timeoff.types'

const MONTHLY_ALLOWANCE = 21
const SHORT_NOTICE_DAYS = 15

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)
  const startDateInput = (body?.startDate as string | undefined)?.trim()
  const endDateInput = (body?.endDate as string | undefined)?.trim()
  const type = (body?.type as string | undefined)?.trim()
  const reason = (body?.reason as string | undefined)?.trim()

  if (!startDateInput) throw createError({ statusCode: 400, message: 'startDate is required' })
  if (!endDateInput) throw createError({ statusCode: 400, message: 'endDate is required' })
  if (!type || type.length < 2 || type.length > 80) {
    throw createError({ statusCode: 400, message: 'type is required (2-80 chars)' })
  }
  if (reason && reason.length > 500) {
    throw createError({ statusCode: 400, message: 'reason max 500 chars' })
  }

  assertDate(startDateInput, 'startDate')
  assertDate(endDateInput, 'endDate')
  const startDate = normalizeDate(startDateInput)
  const endDate = normalizeDate(endDateInput)

  const businessDates = getBusinessDates(startDate, endDate)
  if (!businessDates.length) throw createError({ statusCode: 400, message: 'No working days in range' })

  const monthKey = getMonthKey(startDate)
  const db = await getAdminDb()

  const approvedSnap = await db.collection('timeOffRequests')
    .where('userUid', '==', user.uid)
    .where('monthKey', '==', monthKey)
    .where('status', '==', 'approved')
    .get()
  const used = approvedSnap.docs.reduce((sum, doc) => sum + ((doc.data().days as number) ?? 0), 0)
  const remaining = Math.max(MONTHLY_ALLOWANCE - used, 0)
  if (businessDates.length > remaining) {
    throw createError({ statusCode: 400, message: `Only ${remaining} days remaining for this month` })
  }

  const { nanoid } = await import('nanoid')
  const id = nanoid(10)
  const now = new Date().toISOString()

  const request: TimeOffRequest = {
    id,
    userUid: user.uid,
    userName: user.name || user.email || '',
    userEmail: user.email || '',
    startDate,
    endDate,
    type,
    reason: reason ?? '',
    status: 'pending',
    days: businessDates.length,
    shortNotice: isShortNotice(startDate, SHORT_NOTICE_DAYS),
    monthKey,
    createdAt: now,
    eventIds: [],
  }

  await db.collection('timeOffRequests').doc(id).set(request)
  return request
})
