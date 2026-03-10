import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore'
import type { GameScore } from '~/types/games.types'

export function useGames() {
  const { $firebaseDb } = useNuxtApp()
  const { user } = useAuth()

  /**
   * Save score to Firestore. Only updates if it's a new personal best.
   * Returns true if it was a new personal best.
   */
  async function saveScore(
    gameId: string,
    score: number,
    level: number,
    lines: number,
  ): Promise<boolean> {
    if (!user.value || !$firebaseDb) return false

    const uid = user.value.uid
    const ref = doc($firebaseDb as Parameters<typeof doc>[0], 'games', gameId, 'scores', uid)

    const existing = await getDoc(ref)
    if (existing.exists() && (existing.data()?.score ?? 0) >= score) {
      return false
    }

    await setDoc(ref, {
      uid,
      displayName: user.value.displayName || 'Anonymous',
      photoURL: user.value.photoURL || null,
      score,
      level,
      lines,
      updatedAt: new Date().toISOString(),
    })

    return true
  }

  /**
   * Fetch the top N scores for a given game, sorted by score descending.
   */
  async function getTopScores(gameId: string, count = 10): Promise<GameScore[]> {
    if (!$firebaseDb) return []

    const q = query(
      collection($firebaseDb as Parameters<typeof collection>[0], 'games', gameId, 'scores'),
      orderBy('score', 'desc'),
      limit(count),
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => d.data() as GameScore)
  }

  /**
   * Fetch the current user's personal best for a given game.
   */
  async function getMyScore(gameId: string): Promise<GameScore | null> {
    if (!user.value || !$firebaseDb) return null

    const ref = doc($firebaseDb as Parameters<typeof doc>[0], 'games', gameId, 'scores', user.value.uid)
    const snap = await getDoc(ref)
    return snap.exists() ? (snap.data() as GameScore) : null
  }

  return { saveScore, getTopScores, getMyScore }
}
