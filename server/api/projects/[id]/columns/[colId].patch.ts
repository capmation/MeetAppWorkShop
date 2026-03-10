import { getAdminDb } from '../../../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const projectId = getRouterParam(event, 'id')!
  const colId = getRouterParam(event, 'colId')!
  const body = await readBody(event)

  const patch: Record<string, unknown> = {}
  if (body?.title) patch.title = (body.title as string).trim()
  if (body?.order !== undefined) patch.order = body.order

  const db = await getAdminDb()
  await db.collection('projects').doc(projectId).collection('columns').doc(colId).update(patch)
  return { ok: true }
})
