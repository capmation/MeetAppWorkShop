import { getAdminAuth } from '../utils/firebase-admin'

// Protect all /api/* routes except /api/auth/verify
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  const path = url.pathname

  // Only guard API routes (skip auth verify itself and public routes)
  if (!path.startsWith('/api/') || path === '/api/auth/verify' || path === '/api/health') return

  // Allow unauthenticated read of a meeting (visibility is enforced in handler)
  if (event.node.req.method === 'GET' && /^\/api\/meetings\/[\w-]+$/.test(path)) {
    const authHeaderOpt = getHeader(event, 'authorization')
    if (!authHeaderOpt) return
    if (!authHeaderOpt.startsWith('Bearer ')) return
    const tokenOpt = authHeaderOpt.slice(7)
    try {
      const decoded = await (await getAdminAuth()).verifyIdToken(tokenOpt)
      event.context.user = {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
      }
    }
    catch {
      // if token invalid, proceed unauthenticated for public visibility check
    }
    return
  }

  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'Missing authorization token' })
  }

  const token = authHeader.slice(7)

  try {
    const decoded = await (await getAdminAuth()).verifyIdToken(token)
    // Attach user to event context for downstream handlers
    event.context.user = {
      uid: decoded.uid,
      email: decoded.email,
      name: decoded.name,
    }
  }
  catch {
    throw createError({ statusCode: 401, message: 'Invalid or expired token' })
  }
})
