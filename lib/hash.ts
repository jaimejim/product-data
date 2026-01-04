// Ingredient hashing utilities for cache lookups

/**
 * Generates a SHA-256 hash of the ingredient text for cache lookups.
 *
 * IMPORTANT: The hash is based on the raw ingredient text to preserve:
 * - Ingredient order (concentration/percentage matters)
 * - Exact spelling and formatting
 * - All nuances in the ingredient list
 *
 * This means slightly different ingredient lists will have different hashes,
 * which is intentional - we want exact matches for cache hits.
 */
export async function hashIngredients(rawText: string): Promise<string> {
  // Normalize whitespace (but preserve order and content)
  const normalized = rawText
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space

  // Convert to UTF-8 bytes
  const encoder = new TextEncoder()
  const data = encoder.encode(normalized)

  // Generate SHA-256 hash
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 * Validates that an ingredients hash is in the correct format
 */
export function isValidHash(hash: string): boolean {
  return /^[a-f0-9]{64}$/i.test(hash)
}

/**
 * Normalizes ingredient text for comparison (without hashing).
 * Used for displaying and processing, not for cache keys.
 */
export function normalizeIngredientText(text: string): string {
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ', ')  // Convert newlines to commas
}
