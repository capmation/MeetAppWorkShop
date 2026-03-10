import { getAdminDb } from '../../../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const projectId = getRouterParam(event, 'id')!
  const db = await getAdminDb()
  const snap = await db.collection('projects').doc(projectId).collection('columns').orderBy('order', 'asc').get()
  return snap.docs.map(d => d.data())
})
