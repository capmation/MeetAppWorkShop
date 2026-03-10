import { getAdminDb } from '../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const { nanoid } = await import('nanoid')
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)
  const title = (body?.title as string | undefined)?.trim()
  if (!title || title.length < 1 || title.length > 80) {
    throw createError({ statusCode: 400, message: 'Title required (max 80 chars)' })
  }

  const db = await getAdminDb()
  const id = nanoid(10)

  const project = {
    id,
    title,
    description: ((body?.description as string | undefined) ?? '').trim(),
    color: (body?.color as string | undefined) ?? 'accent',
    hostUid: user.uid,
    hostName: user.name || user.email || '',
    createdAt: new Date().toISOString(),
  }

  await db.collection('projects').doc(id).set(project)

  // Create default columns
  const defaultColumns = [
    { id: nanoid(10), title: 'To Do', order: 1000, projectId: id },
    { id: nanoid(10), title: 'In Progress', order: 2000, projectId: id },
    { id: nanoid(10), title: 'Done', order: 3000, projectId: id },
  ]
  await Promise.all(
    defaultColumns.map(col =>
      db.collection('projects').doc(id).collection('columns').doc(col.id).set(col),
    ),
  )

  return project
})
