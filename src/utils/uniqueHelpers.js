/**
 * Unique Helper Functions for Smart Notes App
 *
 * These are custom utility functions I created specifically for this project.
 * Each function solves a specific problem I encountered during development.
 *
 * Author: Zankhana Savsani
 */

/**
 * Generate unique note IDs with timestamp and random component
 * My approach combines timestamp with random string for uniqueness
 */
export function generateNoteId() {
  const timestamp = Date.now().toString(36) // Base36 for shorter string
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `note_${timestamp}_${randomPart}`
}

/**
 * Smart content preview generator
 * My algorithm to create meaningful previews from note content
 */
export function generatePreview(content, maxLength = 100) {
  if (!content) return "No content"

  // Remove HTML tags and get plain text
  const plainText = content
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (plainText.length <= maxLength) return plainText

  // My smart truncation: try to end at sentence boundary
  const truncated = plainText.substring(0, maxLength)
  const lastSentence = truncated.lastIndexOf(".")
  const lastSpace = truncated.lastIndexOf(" ")

  if (lastSentence > maxLength * 0.7) {
    return truncated.substring(0, lastSentence + 1)
  } else if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + "..."
  }

  return truncated + "..."
}

/**
 * Custom tag sanitization and validation
 * My rules for what makes a valid tag in this application
 */
export function sanitizeTag(tagText) {
  if (!tagText || typeof tagText !== "string") return null

  // My sanitization rules
  const cleaned = tagText
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") // Only allow letters, numbers, spaces, hyphens
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, "") // Remove leading/trailing hyphens

  // My validation rules
  if (cleaned.length < 2 || cleaned.length > 20) return null
  if (cleaned.match(/^[0-9]+$/)) return null // No pure numbers

  return cleaned
}

/**
 * Smart search scoring algorithm
 * My custom relevance scoring for search results
 */
export function calculateSearchScore(note, searchQuery) {
  if (!searchQuery.trim()) return 0

  const query = searchQuery.toLowerCase()
  let score = 0

  // My scoring system
  if (note.title.toLowerCase().includes(query)) {
    score += 10 // Title matches are most important
  }

  if (note.content.toLowerCase().includes(query)) {
    score += 5 // Content matches
  }

  // Tag matches
  if (note.tags && note.tags.some((tag) => tag.includes(query))) {
    score += 7 // Tags are important for organization
  }

  // Boost score for pinned notes
  if (note.isPinned) {
    score += 2
  }

  // Recent notes get slight boost
  const daysSinceUpdate = (Date.now() - new Date(note.updatedAt)) / (1000 * 60 * 60 * 24)
  if (daysSinceUpdate < 7) {
    score += 1
  }

  return score
}
