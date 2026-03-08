import { getAdminDb } from '../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Meeting ID is required' })
  }

  const doc = await (await getAdminDb()).collection('meetings').doc(id).get()
  if (!doc.exists) {
    throw createError({ statusCode: 404, message: 'Meeting not found' })
  }

  const data = doc.data() || {}
  const rawCreatedAt = (data as Record<string, any>).createdAt
  const visibility = (data as Record<string, any>).visibility === 'public' ? 'public' : 'private'

  // Require auth for private meetings
  if (visibility === 'private' && !event.context.user) {
    throw createError({ statusCode: 403, message: 'Unauthorized' })
  }

  return {
    ...data,
    createdAt: typeof rawCreatedAt?.toDate === 'function'
      ? rawCreatedAt.toDate().toISOString()
      : rawCreatedAt ?? null,
    visibility,
  }
})
