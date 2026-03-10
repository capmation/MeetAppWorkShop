import { getAdminDb } from '../../../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const { nanoid } = await import('nanoid')
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const projectId = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const title = (body?.title as string | undefined)?.trim()
  if (!title) throw createError({ statusCode: 400, message: 'Title required' })
  if (!body?.columnId) throw createError({ statusCode: 400, message: 'columnId required' })

  const db = await getAdminDb()
  // Fetch column cards without orderBy to avoid composite index requirement; sort in JS
  const snap = await db.collection('projects').doc(projectId).collection('cards')
    .where('columnId', '==', body.columnId).get()
  const maxOrder = snap.empty
    ? 0
    : Math.max(...snap.docs.map(d => (d.data().order as number) ?? 0))

  const cardId = nanoid(10)
  const card = {
    id: cardId,
    title,
    description: ((body?.description as string | undefined) ?? '').trim(),
    dueDate: (body?.dueDate as string | undefined) ?? null,
    color: (body?.color as string | undefined) ?? 'slate',
    order: typeof body?.order === 'number' ? body.order : maxOrder + 1000,
    columnId: body.columnId as string,
    projectId,
    createdAt: new Date().toISOString(),
  }

  await db.collection('projects').doc(projectId).collection('cards').doc(cardId).set(card)
  return card
})
