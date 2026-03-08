import { getAdminDb } from '../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const { nanoid } = await import('nanoid')
  const user = event.context.user
  const body = await readBody(event)

  const title = (body?.title as string | undefined)?.trim()
  if (!title || title.length < 2 || title.length > 80) {
    throw createError({ statusCode: 400, message: 'Title must be between 2 and 80 characters' })
  }

  const visibilityRaw = (body?.visibility as string | undefined)?.toLowerCase()
  const visibility = visibilityRaw === 'public' ? 'public' : 'private'

  const id = nanoid(10)
  const meeting = {
    id,
    title,
    hostUid: user.uid,
    hostName: user.name || user.email,
    hostEmail: user.email || '',
    createdAt: new Date().toISOString(),
    visibility,
  }

  await (await getAdminDb()).collection('meetings').doc(id).set(meeting)

  return meeting
})
