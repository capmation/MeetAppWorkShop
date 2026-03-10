import { getAdminDb } from '../../utils/firebase-admin'

const DEFAULT_TYPES = ['PTO', 'Unpaid day', 'Birthday']

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const db = await getAdminDb()
  const ref = db.collection('timeOffTypes').doc(user.uid)
  const doc = await ref.get()

  if (!doc.exists) return DEFAULT_TYPES

  const data = doc.data()
  const types = (data?.types as string[] | undefined) ?? []
  if (!types.length) return DEFAULT_TYPES
  return Array.from(new Set(types))
})
