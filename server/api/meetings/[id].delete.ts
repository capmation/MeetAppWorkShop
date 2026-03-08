import { getAdminDb } from '../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const user = event.context.user

  if (!id) {
    throw createError({ statusCode: 400, message: 'Meeting ID is required' })
  }
  if (!user?.uid) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }

  const ref = (await getAdminDb()).collection('meetings').doc(id)
  const doc = await ref.get()

  if (!doc.exists) {
    throw createError({ statusCode: 404, message: 'Meeting not found' })
  }

  const data = doc.data()
  if (!data || data.hostUid !== user.uid) {
    throw createError({ statusCode: 403, message: 'You can only delete your own meetings' })
  }

  await ref.delete()

  return { success: true }
})
