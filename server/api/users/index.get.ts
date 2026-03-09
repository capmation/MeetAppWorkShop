import { getAdminAuth } from '../../utils/firebase-admin'

export default defineEventHandler(async () => {
  try {
    const auth = await getAdminAuth()
    const list = await auth.listUsers(1000)
    return list.users.map(u => ({
      uid: u.uid,
      displayName: u.displayName || u.email || 'Unknown user',
      photoURL: u.photoURL || null,
    }))
  }
  catch (err) {
    console.warn('[api/users] list failed, returning empty list', err)
    return []
  }
})
