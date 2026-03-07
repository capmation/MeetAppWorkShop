import { getAdminDb } from '../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Meeting ID is required' })
  }

  const doc = await (await getAdminDb()).collection('meetings').doc(id).get()
  if (!doc.exists) {
    throw createError({ statusCode: 404, message: 'Meeting not found' })
  }

  return doc.data()
})
