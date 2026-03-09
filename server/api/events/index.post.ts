import { getAdminDb } from '../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const { nanoid } = await import('nanoid')
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)

  const title = (body?.title as string | undefined)?.trim()
  if (!title || title.length < 1 || title.length > 80) {
    throw createError({ statusCode: 400, message: 'Title required (max 80 chars)' })
  }
  if (!body.startAt || !body.endAt) {
    throw createError({ statusCode: 400, message: 'startAt and endAt are required' })
  }
  if (body.startAt >= body.endAt) {
    throw createError({ statusCode: 400, message: 'endAt must be after startAt' })
  }

  const db = await getAdminDb()
  const id = nanoid(10)

  let meetingId: string | null = null
  if (body.isVirtual) {
    meetingId = nanoid(10)
    const meeting = {
      id: meetingId,
      title,
      hostUid: user.uid,
      hostName: user.name || user.email || '',
      hostEmail: user.email || '',
      createdAt: new Date().toISOString(),
      visibility: 'private',
    }
    await db.collection('meetings').doc(meetingId).set(meeting)
  }

  const calEvent = {
    id,
    title,
    description: ((body.description as string | undefined) ?? '').trim(),
    startAt: body.startAt as string,
    endAt: body.endAt as string,
    isVirtual: !!body.isVirtual,
    meetingId,
    hostUid: user.uid,
    hostName: user.name || user.email || '',
    color: (body.color as string | undefined) ?? 'accent',
  }

  await db.collection('events').doc(id).set(calEvent)
  return calEvent
})
