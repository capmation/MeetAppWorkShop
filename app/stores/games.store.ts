import { defineStore } from 'pinia'
import type { GameDefinition, GameScore } from '~/types/games.types'

export const useGamesStore = defineStore('games', {
  state: () => ({
    activeGame: null as string | null,
    scores: {} as Record<string, GameScore[]>,
  }),
  actions: {
    setActiveGame(id: string | null) {
      this.activeGame = id
    },
    setScores(gameId: string, scores: GameScore[]) {
      this.scores[gameId] = scores
    },
  },
})

/**
 * Registry of all available games.
 * Add new entries here to make them appear in the Games hub.
 */
export const GAME_DEFINITIONS: GameDefinition[] = [
  {
    id: 'tetris',
    title: 'Tetris',
    description: 'Stack falling blocks, clear lines, and race through 10 speed levels. How high can you score?',
    emoji: '🟦',
    available: true,
    color: 'from-cyan-500/20 to-blue-600/20',
  },
  {
    id: 'snake',
    title: 'Snake',
    description: 'Guide the snake, eat apples, and avoid walls. A classic endless challenge.',
    emoji: '🐍',
    available: true,
    color: 'from-green-500/20 to-emerald-600/20',
  },
  {
    id: 'breakout',
    title: 'Breakout',
    description: 'Bounce the ball, smash bricks, and clear the board with limited lives.',
    emoji: '🧱',
    available: false,
    color: 'from-orange-500/20 to-red-600/20',
  },
]
