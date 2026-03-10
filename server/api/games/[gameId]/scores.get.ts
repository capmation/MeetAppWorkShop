import { getAdminDb } from '../../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const gameId = getRouterParam(event, 'gameId')
  if (!gameId) throw createError({ statusCode: 400, message: 'Missing gameId' })

  const db = await getAdminDb()
  const snap = await db
    .collection('games')
    .doc(gameId)
    .collection('scores')
    .orderBy('score', 'desc')
    .limit(10)
    .get()

  return snap.docs.map(d => d.data())
})
