import { getAdminAuth } from '../../utils/firebase-admin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const token = body?.token as string | undefined

  if (!token) {
    throw createError({ statusCode: 400, message: 'Token is required' })
  }

  try {
    const decoded = await (await getAdminAuth()).verifyIdToken(token)
    return {
      valid: true,
      uid: decoded.uid,
      email: decoded.email,
    }
  }
  catch {
    throw createError({ statusCode: 401, message: 'Invalid token' })
  }
})
