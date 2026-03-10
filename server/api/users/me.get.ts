import { getAdminDb } from '../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const db = await getAdminDb()
  const doc = await db.collection('userSettings').doc(user.uid).get()

  if (!doc.exists) return { homePage: null, onboardingDone: false }

  const data = doc.data()!
  return {
    homePage: data.homePage ?? null,
    onboardingDone: data.onboardingDone ?? false,
  }
})
