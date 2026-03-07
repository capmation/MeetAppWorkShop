// Health check endpoint for Render and monitoring
export default defineEventHandler(() => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})
