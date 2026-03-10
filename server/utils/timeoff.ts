import type { TimeOffRequest } from '~/types/timeoff.types'

interface UserContext {
  uid: string
  name?: string
  email?: string
}

export function assertDate(value: string, field: string): void {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    throw createError({ statusCode: 400, message: `${field} is invalid` })
  }
}

export function normalizeDate(value: string): string {
  assertDate(value, 'date')
  return new Date(value).toISOString().slice(0, 10)
}

export function getMonthKey(dateStr: string): string {
  return normalizeDate(dateStr).slice(0, 7)
}

export function getBusinessDates(startDate: string, endDate: string): string[] {
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start > end) throw createError({ statusCode: 400, message: 'startDate must be before endDate' })

  const dates: string[] = []
  const cursor = new Date(start)
  while (cursor <= end) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) {
      dates.push(cursor.toISOString().slice(0, 10))
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return dates
}

export function isShortNotice(startDate: string, thresholdDays = 15): boolean {
  const start = new Date(startDate)
  const today = new Date()
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diff = start.getTime() - today.getTime()
  const days = Math.floor(diff / 86_400_000)
  return days < thresholdDays
}

function buildEventTimes(dateStr: string) {
  const start = new Date(`${dateStr}T09:00:00`)
  const end = new Date(`${dateStr}T18:00:00`)
  return { start: start.toISOString(), end: end.toISOString() }
}

export async function createCalendarEventsForRequest(
  db: FirebaseFirestore.Firestore,
  request: TimeOffRequest,
  user: UserContext,
): Promise<string[]> {
  const { nanoid } = await import('nanoid')
  const dates = getBusinessDates(request.startDate, request.endDate)
  const eventIds: string[] = []

  for (const date of dates) {
    const { start, end } = buildEventTimes(date)
    const id = nanoid(10)
    await db.collection('events').doc(id).set({
      id,
      title: `${request.type} (Time Off)`,
      description: request.reason ?? '',
      startAt: start,
      endAt: end,
      isVirtual: false,
      meetingId: null,
      hostUid: user.uid,
      hostName: user.name || user.email || '',
      color: 'amber',
    })
    eventIds.push(id)
  }

  return eventIds
}

export async function deleteCalendarEvents(db: FirebaseFirestore.Firestore, eventIds: string[], userUid: string): Promise<void> {
  if (!eventIds?.length) return
  const deletes = eventIds.map(async (id) => {
    const ref = db.collection('events').doc(id)
    const doc = await ref.get()
    if (!doc.exists) return
    const data = doc.data()
    if (data?.hostUid === userUid) await ref.delete()
  })
  await Promise.all(deletes)
}
