import type { GameScore } from '~/types/games.types'

export function useGames() {
  const { idToken, refreshToken, user } = useAuth()

  async function getToken(): Promise<string> {
    const token = idToken.value ?? await refreshToken()
    if (!token) throw new Error('Not authenticated')
    return token
  }

  /**
   * Save score via server API (firebase-admin, no client rules needed).
   * Only stores if it's a new personal best. Returns true if it was.
   */
  async function saveScore(
    gameId: string,
    score: number,
    level: number,
    lines: number,
  ): Promise<boolean> {
    const token = await getToken()
    const result = await $fetch<{ saved: boolean, newBest: boolean }>(
      `/api/games/${gameId}/scores`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: {
          score,
          level,
          lines,
          displayName: user.value?.displayName || 'Anonymous',
          photoURL: user.value?.photoURL ?? null,
        },
      },
    )
    return result.newBest
  }

  /**
   * Fetch the top 10 scores for a given game.
   */
  async function getTopScores(gameId: string): Promise<GameScore[]> {
    const token = await getToken()
    return $fetch<GameScore[]>(`/api/games/${gameId}/scores`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  return { saveScore, getTopScores }
}
