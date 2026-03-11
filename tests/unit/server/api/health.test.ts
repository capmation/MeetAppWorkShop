// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest'

import healthHandler from '../../../../server/api/health.get'

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const result = await (healthHandler as Function)({})
    expect(result.status).toBe('ok')
  })

  it('returns an ISO timestamp', async () => {
    const before = Date.now()
    const result = await (healthHandler as Function)({})
    const after = Date.now()
    const ts = new Date(result.timestamp).getTime()
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })

  it('always returns an object with exactly status and timestamp keys', async () => {
    const result = await (healthHandler as Function)({})
    expect(Object.keys(result).sort()).toEqual(['status', 'timestamp'])
  })
})
