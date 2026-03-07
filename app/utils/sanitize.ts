import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize user-generated text for safe display (OWASP A03 - XSS prevention).
 * Two-step approach for reliability across SSR and browser environments:
 * 1. Regex strips script/style block content and all HTML tags
 * 2. DOMPurify as a second layer in browser contexts
 */
export function sanitizeMessage(text: string): string {
  // Step 1: Remove script/style blocks (including their inner content)
  const noScripts = text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Step 2: Strip remaining HTML tags
  const noTags = noScripts.replace(/<[^>]*>/g, '')

  // Step 3: DOMPurify as final layer (effective in browser, passthrough in SSR after step 2)
  return DOMPurify.sanitize(noTags, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
}

/**
 * Sanitize a display name (no HTML allowed).
 */
export function sanitizeName(name: string): string {
  const noTags = name.replace(/<[^>]*>/g, '')
  return DOMPurify.sanitize(noTags, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] }).trim().slice(0, 100)
}
