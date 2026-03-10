import { getAdminDb } from '../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)
  const allowed = ['homePage', 'onboardingDone']
  const update: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) update[key] = body[key]
  }
  if (Object.keys(update).length === 0) {
    throw createError({ statusCode: 400, message: 'No valid fields to update' })
  }

  const db = await getAdminDb()
  await db.collection('userSettings').doc(user.uid).set(update, { merge: true })
  return { ok: true }
})
