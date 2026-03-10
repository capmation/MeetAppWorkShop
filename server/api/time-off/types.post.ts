import { getAdminDb } from '../../utils/firebase-admin'

const DEFAULT_TYPES = ['PTO', 'Unpaid day', 'Birthday']

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)
  const label = (body?.label as string | undefined)?.trim()
  if (!label || label.length < 2 || label.length > 80) {
    throw createError({ statusCode: 400, message: 'Label must be 2-80 chars' })
  }

  const db = await getAdminDb()
  const ref = db.collection('timeOffTypes').doc(user.uid)
  const doc = await ref.get()
  const existing = doc.exists ? ((doc.data()?.types as string[] | undefined) ?? []) : DEFAULT_TYPES

  const existsCaseInsensitive = existing.some(t => t.toLowerCase() === label.toLowerCase())
  if (existsCaseInsensitive) return existing

  const updated = [...existing, label]
  await ref.set({ types: updated }, { merge: true })

  return updated
})
