import { getAdminDb } from '../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)

  const db = await getAdminDb()
  const ref = db.collection('events').doc(id)
  const doc = await ref.get()

  if (!doc.exists) throw createError({ statusCode: 404, message: 'Event not found' })
  if (doc.data()?.hostUid !== user.uid) throw createError({ statusCode: 403, message: 'Forbidden' })

  const patch: Record<string, unknown> = {}
  if (body.title !== undefined) patch.title = (body.title as string).trim()
  if (body.description !== undefined) patch.description = (body.description as string).trim()
  if (body.startAt !== undefined) patch.startAt = body.startAt
  if (body.endAt !== undefined) patch.endAt = body.endAt
  if (body.color !== undefined) patch.color = body.color

  await ref.update(patch)
  return { id, ...doc.data(), ...patch }
})
