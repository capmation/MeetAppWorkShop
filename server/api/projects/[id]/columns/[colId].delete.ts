import { getAdminDb } from '../../../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const projectId = getRouterParam(event, 'id')!
  const colId = getRouterParam(event, 'colId')!
  const db = await getAdminDb()

  await db.collection('projects').doc(projectId).collection('columns').doc(colId).delete()

  // Delete all cards in this column
  const cardsSnap = await db.collection('projects').doc(projectId)
    .collection('cards').where('columnId', '==', colId).get()
  await Promise.all(cardsSnap.docs.map(d => d.ref.delete()))

  return { ok: true }
})
