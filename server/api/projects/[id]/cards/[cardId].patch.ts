import { getAdminDb } from '../../../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const projectId = getRouterParam(event, 'id')!
  const cardId = getRouterParam(event, 'cardId')!
  const body = await readBody(event)

  const patch: Record<string, unknown> = {}
  if (body?.title !== undefined) patch.title = (body.title as string).trim()
  if (body?.description !== undefined) patch.description = body.description
  if (body?.dueDate !== undefined) patch.dueDate = body.dueDate
  if (body?.color !== undefined) patch.color = body.color
  if (body?.columnId !== undefined) patch.columnId = body.columnId
  if (body?.order !== undefined) patch.order = body.order

  const db = await getAdminDb()
  await db.collection('projects').doc(projectId).collection('cards').doc(cardId).update(patch)
  return { ok: true }
})
