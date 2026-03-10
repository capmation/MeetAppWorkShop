import { getAdminDb } from '../../../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const { nanoid } = await import('nanoid')
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const title = (body?.title as string | undefined)?.trim()
  if (!title) throw createError({ statusCode: 400, message: 'Title required' })

  const db = await getAdminDb()
  const snap = await db.collection('projects').doc(projectId).collection('columns')
    .orderBy('order', 'desc').limit(1).get()
  const maxOrder = snap.empty ? 0 : (snap.docs[0].data().order as number)

  const colId = nanoid(10)
  const col = { id: colId, title, order: maxOrder + 1000, projectId }
  await db.collection('projects').doc(projectId).collection('columns').doc(colId).set(col)
  return col
})
