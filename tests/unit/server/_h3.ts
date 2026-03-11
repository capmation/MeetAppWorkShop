/**
 * Typed accessors for the h3 global stubs registered in tests/setup.ts.
 * Server handlers use these as free variables (Nitro auto-imports).
 * Use these helpers in tests instead of importing from 'h3'.
 */
import type { MockInstance } from 'vitest'

export const h3Mocks = {
  get readBody() { return (globalThis as any).readBody as MockInstance },
  get getRouterParam() { return (globalThis as any).getRouterParam as MockInstance },
  get getHeader() { return (globalThis as any).getHeader as MockInstance },
  get getRequestURL() { return (globalThis as any).getRequestURL as MockInstance },
}
