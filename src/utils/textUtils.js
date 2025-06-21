/**
 * Custom Text Analysis Utilities
 *
 * These functions were developed specifically for the Smart Notes application
 * to provide accurate text statistics and content analysis.
 *
 * Author: Zankhana Savsani
 * Created for: Smart Notes App
 */

/**
 * Calculate word count using custom algorithm
 * Handles edge cases like multiple spaces, punctuation, and empty content
 */
export function getWordCount(text) {
  if (!text || typeof text !== "string") return 0

  // My custom approach: Remove HTML tags first, then count words
  const plainText = text.replace(/<[^>]*>/g, " ")

  // Split by whitespace and filter out empty strings and single characters
  const words = plainText
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0 && word.match(/[a-zA-Z0-9]/))

  return words.length
}

/**
 * Character count with HTML tag exclusion
 * My implementation focuses on actual readable content
 */
export function getCharCount(text) {
  if (!text || typeof text !== "string") return 0

  // Remove HTML tags to count only visible characters
  const plainText = text.replace(/<[^>]*>/g, "")
  return plainText.length
}

/**
 * Reading time estimation based on average reading speed
 * Custom formula: 200 words per minute for technical content
 */
export function getReadingTime(text) {
  const wordCount = getWordCount(text)
  const wordsPerMinute = 200 // Adjusted for technical content
  const minutes = Math.ceil(wordCount / wordsPerMinute)

  if (minutes < 1) return "Less than 1 min"
  if (minutes === 1) return "1 min"
  return `${minutes} mins`
}

/**
 * Content complexity analysis
 * My own algorithm to determine note complexity
 */
export function getContentComplexity(text) {
  const wordCount = getWordCount(text)
  const charCount = getCharCount(text)

  if (wordCount === 0) return "Empty"

  const avgWordLength = charCount / wordCount

  if (wordCount < 50) return "Simple"
  if (wordCount < 200 && avgWordLength < 6) return "Medium"
  if (wordCount > 500 || avgWordLength > 7) return "Complex"

  return "Medium"
}

/**
 * Extract plain text from HTML content
 * My approach: Safe DOM parsing with fallback methods
 */
export function extractPlainText(html) {
  if (!html) return ""

  // Check if we're in a browser environment
  if (typeof document !== "undefined") {
    // Create a temporary div to parse HTML safely
    const temp = document.createElement("div")
    temp.innerHTML = html
    return temp.textContent || temp.innerText || ""
  }

  // Fallback for server-side or when document is not available
  return html.replace(/<[^>]*>/g, "")
}

/**
 * Truncate text with smart word boundary detection
 * My implementation preserves word integrity
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text

  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")

  // If we can find a word boundary, use it
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace).trim() + "..."
  }

  return truncated.trim() + "..."
}

/**
 * Highlight search terms with custom styling
 * My approach: Case-insensitive with HTML-safe highlighting
 */
export function highlightSearchTerm(text, searchTerm) {
  if (!searchTerm || !text) return text

  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

/**
 * Basic HTML sanitization for security
 * My implementation: Remove dangerous elements while preserving formatting
 */
export function sanitizeHTML(html) {
  if (typeof document === "undefined") {
    // Server-side fallback: basic tag removal
    return html.replace(/<script[^>]*>.*?<\/script>/gi, "").replace(/<[^>]*on\w+="[^"]*"/gi, "")
  }

  const temp = document.createElement("div")
  temp.innerHTML = html

  // Remove script tags and event handlers
  const scripts = temp.querySelectorAll("script")
  scripts.forEach((script) => script.remove())

  const allElements = temp.querySelectorAll("*")
  allElements.forEach((element) => {
    const dangerousAttrs = ["onclick", "onload", "onerror", "onmouseover", "onmouseout"]
    dangerousAttrs.forEach((attr) => {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr)
      }
    })
  })

  return temp.innerHTML
}

/**
 * Format dates with relative time display
 * My approach: Human-friendly date formatting
 */
export function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now - date
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))

  if (diffInMinutes < 1) {
    return "Just now"
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`
  } else if (diffInDays === 0) {
    return "Today"
  } else if (diffInDays === 1) {
    return "Yesterday"
  } else if (diffInDays < 7) {
    return `${diffInDays} days ago`
  } else {
    return date.toLocaleDateString()
  }
}

/**
 * Export notes to plain text format
 * My custom export format with metadata
 */
export function exportToText(notes) {
  let content = `# Smart Notes Export
Generated on: ${new Date().toLocaleString()}
Total Notes: ${notes.length}

`

  notes.forEach((note, index) => {
    content += `## Note ${index + 1}: ${note.title}
`
    content += `Created: ${formatDate(note.createdAt)}
`
    content += `Last Modified: ${formatDate(note.updatedAt)}
`
    if (note.tags && note.tags.length > 0) {
      content += `Tags: ${note.tags.join(", ")}
`
    }
    content += `Word Count: ${getWordCount(note.content)}
`
    content += `Reading Time: ${getReadingTime(note.content)}
`
    content += "\n"
    content += extractPlainText(note.content)
    content += "\n" + "=".repeat(50) + "\n"
  })

  return content
}

/**
 * Export notes to Markdown format
 * My enhanced Markdown export with metadata
 */
export function exportToMarkdown(notes) {
  let content = `# 📝 Smart Notes Export

**Generated:** ${new Date().toLocaleString()}  
**Total Notes:** ${notes.length}  

---

`

  notes.forEach((note, index) => {
    content += `## ${index + 1}. ${note.title}

`
    content += `> **Created:** ${formatDate(note.createdAt)}  
> **Updated:** ${formatDate(note.updatedAt)}  
`
    if (note.tags && note.tags.length > 0) {
      content += `> **Tags:** ${note.tags.map((tag) => `\`${tag}\``).join(", ")}  
`
    }
    content += `> **Stats:** ${getWordCount(note.content)} words • ${getReadingTime(note.content)} read  

`

    // Convert HTML to Markdown with my custom approach
    const markdownContent = note.content
      .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
      .replace(/<b>(.*?)<\/b>/g, "**$1**")
      .replace(/<em>(.*?)<\/em>/g, "*$1*")
      .replace(/<i>(.*?)<\/i>/g, "*$1*")
      .replace(/<u>(.*?)<\/u>/g, "_$1_")
      .replace(/<p>(.*?)<\/p>/g, "$1\n")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<[^>]*>/g, "")

    content += markdownContent
    content += "\n---\n"
  })

  return content
}

/**
 * Download file utility with custom naming
 * My approach: Smart filename generation with timestamps
 */
export function downloadFile(content, filename, mimeType = "text/plain") {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
  const finalFilename = filename.includes(".") ? filename : `${filename}_${timestamp}.txt`

  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = finalFilename
  link.style.display = "none"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
