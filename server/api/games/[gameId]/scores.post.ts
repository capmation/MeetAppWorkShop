import { getAdminDb } from '../../../utils/firebase-admin'
import { getIo } from '../../../plugins/socket.io'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user?.uid) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const gameId = getRouterParam(event, 'gameId')
  if (!gameId) throw createError({ statusCode: 400, message: 'Missing gameId' })

  const body = await readBody<{ score: number, level: number, lines: number, displayName: string, photoURL: string | null }>(event)

  if (typeof body?.score !== 'number') {
    throw createError({ statusCode: 400, message: 'Invalid body' })
  }

  const db = await getAdminDb()
  const ref = db.collection('games').doc(gameId).collection('scores').doc(user.uid)
  const existing = await ref.get()

  if (existing.exists && (existing.data()?.score ?? 0) >= body.score) {
    return { saved: false, newBest: false }
  }

  const entry = {
    uid: user.uid,
    displayName: body.displayName || user.name || 'Anonymous',
    photoURL: body.photoURL ?? null,
    score: body.score,
    level: body.level,
    lines: body.lines,
    updatedAt: new Date().toISOString(),
  }

  await ref.set(entry)

  // Push real-time update to all clients watching the leaderboard
  getIo()?.to(`games-lb-${gameId}`).emit('games:score-update', { gameId, entry })

  return { saved: true, newBest: true }
})
