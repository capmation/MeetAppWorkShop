import { vi } from 'vitest'

// ── Nitro/H3 auto-import stubs ─────────────────────────────────────────────
// Server files under server/ use h3 functions as free variables (Nitro
// auto-imports them at build time). In the Vitest environment these transforms
// do NOT run, so we register them on globalThis so that importing any server
// handler does not throw "defineEventHandler is not defined".
vi.stubGlobal('defineEventHandler', (handler: unknown) => handler)
vi.stubGlobal('createError', (opts: { statusCode: number; message: string }) => {
  const err = new Error(opts.message) as Error & { statusCode: number }
  err.statusCode = opts.statusCode
  return err
})
// I/O helpers — set as vi.fn() so tests can configure return values
vi.stubGlobal('readBody', vi.fn())
vi.stubGlobal('getRouterParam', vi.fn())
vi.stubGlobal('getHeader', vi.fn())
vi.stubGlobal('getRequestURL', vi.fn())

// ── Firebase client mocks ──────────────────────────────────────────────────
// Mock Firebase modules globally
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(() => ({})),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
}))
