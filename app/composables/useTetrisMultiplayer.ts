import type { TetrisMatchPlayer, TetrisRanking } from '~/types/socket.types'

export function useTetrisMultiplayer() {
  const { getSocket, connect } = useSocket()
  const { user, idToken, refreshToken } = useAuth()

  // ── State ─────────────────────────────────────────────────────────
  const matchId = ref<string | null>(null)
  const matchPlayers = ref<TetrisMatchPlayer[]>([])
  const opponentBoards = ref<Record<string, (string | null)[][]>>({})
  const eliminatedPlayers = ref<Record<string, number>>({}) // uid → finalScore
  const pendingGarbage = ref(0)
  const matchEnded = ref(false)
  const rankings = ref<TetrisRanking[]>([])

  let boardUpdateInterval: ReturnType<typeof setInterval> | null = null
  let getBoardFn: (() => (string | null)[][]) | null = null

  // ── Board update sender ───────────────────────────────────────────
  function registerBoardSource(fn: () => (string | null)[][]) {
    getBoardFn = fn
  }

  function startBoardUpdates() {
    if (!matchId.value) return
    boardUpdateInterval = setInterval(() => {
      if (!getBoardFn || !matchId.value) return
      getSocket().emit('tetris:board-update', { matchId: matchId.value, rows: getBoardFn() })
    }, 100) // 10 fps
  }

  function stopBoardUpdates() {
    if (boardUpdateInterval) { clearInterval(boardUpdateInterval); boardUpdateInterval = null }
  }

  // ── Outgoing events ───────────────────────────────────────────────
  function sendGarbage(lines: number) {
    if (!matchId.value || lines <= 0) return
    getSocket().emit('tetris:garbage-send', { matchId: matchId.value, lines })
  }

  function notifyGameOver(score: number, level: number, lines: number) {
    if (!matchId.value) return
    stopBoardUpdates()
    getSocket().emit('tetris:game-over', { matchId: matchId.value, score, level, lines })
  }

  // ── Consume pending garbage ───────────────────────────────────────
  function takePendingGarbage(): number {
    const g = pendingGarbage.value
    pendingGarbage.value = 0
    return g
  }

  // ── Socket event listeners ────────────────────────────────────────
  function onOpponentBoard({ uid, rows }: { uid: string; rows: (string | null)[][] }) {
    opponentBoards.value = { ...opponentBoards.value, [uid]: rows }
  }

  function onGarbageRecv({ lines }: { lines: number; fromUid: string }) {
    pendingGarbage.value += lines
  }

  function onPlayerOut({ uid, finalScore }: { uid: string; displayName: string; finalScore: number }) {
    eliminatedPlayers.value = { ...eliminatedPlayers.value, [uid]: finalScore }
  }

  function onMatchEnd({ rankings: r }: { rankings: TetrisRanking[] }) {
    matchEnded.value = true
    rankings.value = r
    stopBoardUpdates()
  }

  function registerEvents() {
    const s = getSocket()
    s.on('tetris:opponent-board', onOpponentBoard)
    s.on('tetris:garbage-recv', onGarbageRecv)
    s.on('tetris:player-out', onPlayerOut)
    s.on('tetris:match-end', onMatchEnd)
  }

  function unregisterEvents() {
    const s = getSocket()
    s.off('tetris:opponent-board', onOpponentBoard)
    s.off('tetris:garbage-recv', onGarbageRecv)
    s.off('tetris:player-out', onPlayerOut)
    s.off('tetris:match-end', onMatchEnd)
    stopBoardUpdates()
  }

  // ── Lobby connection ──────────────────────────────────────────────
  async function joinLobby() {
    const token = idToken.value ?? await refreshToken()
    if (!token || !user.value) return
    const s = connect()
    s.emit('tetris:lobby-join', {
      token,
      user: {
        uid: user.value.uid,
        displayName: user.value.displayName || 'Player',
        photoURL: user.value.photoURL ?? null,
      },
    })
  }

  function leaveLobby() {
    getSocket().emit('tetris:lobby-leave')
  }

  function joinQueue() {
    getSocket().emit('tetris:queue-join')
  }

  function leaveQueue() {
    getSocket().emit('tetris:queue-leave')
  }

  return {
    // State
    matchId,
    matchPlayers,
    opponentBoards,
    eliminatedPlayers,
    pendingGarbage,
    matchEnded,
    rankings,
    // Board
    registerBoardSource,
    startBoardUpdates,
    stopBoardUpdates,
    // Outgoing
    sendGarbage,
    notifyGameOver,
    takePendingGarbage,
    // Event management
    registerEvents,
    unregisterEvents,
    // Lobby
    joinLobby,
    leaveLobby,
    joinQueue,
    leaveQueue,
  }
}
