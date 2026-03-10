import { getAdminDb } from '../../../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const projectId = getRouterParam(event, 'id')!
  const cardId = getRouterParam(event, 'cardId')!
  const db = await getAdminDb()
  await db.collection('projects').doc(projectId).collection('cards').doc(cardId).delete()
  return { ok: true }
})
