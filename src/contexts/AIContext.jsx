"use client"

import { createContext, useContext, useState } from "react"

const AIContext = createContext()

// Dynamic AI service using Groq APIs
class AIService {
  constructor() {
    // Groq API configuration - environment variables are not accessible on client
    this.groqConfig = {
      baseURL: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: null, // Will be set from server if available
      models: {
        fast: "llama3-8b-8192", // Fast model for grammar and glossary
        smart: "llama3-70b-8192", // Smart model for summaries and insights
      },
    }

    // Processing flags
    this.isProcessing = false
    this.requestCache = new Map()
    this.apiKeyValid = false // Default to false since we can't access env vars on client

    // Enhanced fallback glossary
    this.fallbackGlossary = {
      javascript: "A versatile programming language used for web development and interactive applications.",
      react: "A JavaScript library for building user interfaces with component-based architecture.",
      api: "Application Programming Interface - allows different software applications to communicate.",
      database: "An organized collection of structured data stored electronically.",
      algorithm: "A step-by-step procedure for solving problems or performing computational tasks.",
      html: "HyperText Markup Language - the standard markup language for creating web pages.",
      css: "Cascading Style Sheets - used to describe the presentation and formatting of HTML documents.",
      ui: "User Interface - the visual elements and controls that users interact with.",
      ux: "User Experience - the overall experience a person has when using a product.",
      seo: "Search Engine Optimization - improving website visibility in search engine results.",
      cms: "Content Management System - software for creating and managing digital content.",
      saas: "Software as a Service - software delivered over the internet on a subscription basis.",
      "machine learning": "A subset of AI that enables computers to learn without explicit programming.",
      "neural networks": "Computing systems inspired by biological neural networks.",
      "deep learning": "Machine learning using neural networks with multiple layers.",
      "responsive design": "Web design that works well across different devices and screen sizes.",
      frontend: "The client-side part of applications that users interact with directly.",
      backend: "The server-side part that handles data, logic, and infrastructure.",
      encryption: "Converting data into a coded format to protect it from unauthorized access.",
      "rich text": "Text formatting that includes styling like bold, italic, and colors.",
      "text editing": "The process of modifying and formatting written content.",
      "note management": "Organizing, storing, and retrieving digital notes efficiently.",
      "password encryption": "Securing data by converting it using password-based algorithms.",
      "smart search": "Intelligent search functionality that understands context and intent.",
      "auto-glossary": "Automatic identification and definition of technical terms in text.",
      "grammar checking": "Automated analysis of text for grammatical and spelling errors.",
    }
  }

  // Check if API key is valid - not available on client side
  async checkAPIKey() {
    this.apiKeyValid = false
    return false
  }

  // Real Groq API call function - not available on client side
  async callGroqAPI(messages, model = "llama3-8b-8192", maxTokens = 1000) {
    throw new Error("Groq API not available on client side")
  }

  // Enhanced Grammar Check with fallback priority
  async checkGrammar(text) {
    if (!text || text.trim().length === 0) {
      return []
    }

    const cleanText = this.cleanText(text)
    if (cleanText.length < 3) {
      return []
    }

    // Check cache first
    const cacheKey = `grammar_${this.hashString(cleanText)}`
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)
    }

    // Use local grammar check since API is not available on client
    const errors = this.localGrammarCheck(cleanText)
    this.requestCache.set(cacheKey, errors)
    return errors
  }

  // Auto Glossary with fallback priority
  async autoHighlightGlossary(text) {
    if (this.isProcessing) {
      return text
    }

    if (!text || text.trim().length < 10) {
      return text
    }

    // Check if already highlighted
    if (text.includes('class="auto-glossary-term"') || text.includes('class="manual-glossary-term"')) {
      return text
    }

    this.isProcessing = true

    try {
      const cleanText = this.cleanText(text)

      // Check cache first
      const cacheKey = `glossary_${this.hashString(cleanText)}`
      if (this.requestCache.has(cacheKey)) {
        const cachedTerms = this.requestCache.get(cacheKey)
        return this.applyGlossaryHighlighting(text, cachedTerms)
      }

      // Use manual detection since API is not available on client
      const terms = this.manualGlossaryDetection(cleanText)

      // Cache the results
      this.requestCache.set(cacheKey, terms)
      return this.applyGlossaryHighlighting(text, terms)
    } finally {
      this.isProcessing = false
    }
  }

  // Manual glossary detection (fallback)
  manualGlossaryDetection(text) {
    const terms = []
    const lowerText = text.toLowerCase()

    // Check for terms in our fallback glossary
    Object.keys(this.fallbackGlossary).forEach((term) => {
      if (lowerText.includes(term)) {
        terms.push({
          term: term,
          definition: this.fallbackGlossary[term],
        })
      }
    })

    return terms
  }

  // Summary Generation with fallback
  async generateSummary(text) {
    if (!text || text.trim().length < 20) {
      return "Text is too short to summarize effectively. Please add more content."
    }

    const cleanText = this.cleanText(text)
    if (cleanText.length < 30) {
      return "Text is too short to summarize effectively. Please add more content."
    }

    // Check cache
    const cacheKey = `summary_${this.hashString(cleanText)}`
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)
    }

    // Use fallback summary since API is not available on client
    const summary = this.fallbackSummary(cleanText)
    this.requestCache.set(cacheKey, summary)
    return summary
  }

  // Insights Generation with fallback
  async getInsights(text) {
    if (!text || text.trim().length < 20) {
      return [
        {
          type: "info",
          title: "Brief Content",
          message: "This note is quite short. Consider adding more details.",
        },
      ]
    }

    const cleanText = this.cleanText(text)

    // Check cache
    const cacheKey = `insights_${this.hashString(cleanText)}`
    if (this.requestCache.has(cacheKey)) {
      return this.requestCache.get(cacheKey)
    }

    // Use fallback insights since API is not available on client
    const insights = this.fallbackInsights(cleanText)
    this.requestCache.set(cacheKey, insights)
    return insights
  }

  // Apply glossary highlighting
  applyGlossaryHighlighting(text, terms) {
    if (!terms || terms.length === 0) {
      return text
    }

    let highlightedText = text
    let termsFound = 0

    // Sort terms by length (longest first) to avoid partial matches
    const sortedTerms = terms.sort((a, b) => b.term.length - a.term.length)

    sortedTerms.forEach(({ term, definition }) => {
      const regex = new RegExp(`\\b${this.escapeRegExp(term)}\\b`, "gi")
      const matches = highlightedText.match(regex)

      if (matches) {
        termsFound++

        highlightedText = highlightedText.replace(regex, (match) => {
          return `<span class="auto-glossary-term" data-term="${term}" data-definition="${this.escapeHtml(definition)}">
            ${match}
            <span class="glossary-tooltip">${this.escapeHtml(definition)}</span>
          </span>`
        })
      }
    })

    return highlightedText
  }

  // Enhanced local grammar check (fallback)
  localGrammarCheck(text) {
    const errors = []
    const words = text.split(/\s+/)

    // Common words to avoid false positives
    const commonWords = new Set([
      "the",
      "be",
      "to",
      "of",
      "and",
      "a",
      "in",
      "that",
      "have",
      "i",
      "it",
      "for",
      "not",
      "on",
      "with",
      "he",
      "as",
      "you",
      "do",
      "at",
      "this",
      "but",
      "his",
      "by",
      "from",
      "they",
      "she",
      "or",
      "an",
      "will",
      "my",
      "one",
      "all",
      "would",
      "there",
      "their",
      "what",
      "so",
      "up",
      "out",
      "if",
      "about",
      "who",
      "get",
      "which",
      "go",
      "me",
      "when",
      "make",
      "can",
      "like",
      "time",
      "no",
      "just",
      "him",
      "know",
      "take",
      "people",
      "into",
      "year",
      "your",
      "good",
      "some",
      "could",
      "them",
      "see",
      "other",
      "than",
      "then",
      "now",
      "look",
      "only",
      "come",
      "its",
      "over",
      "think",
      "also",
      "back",
      "after",
      "use",
      "two",
      "how",
      "our",
      "work",
      "first",
      "well",
      "way",
      "even",
      "new",
      "want",
      "because",
      "any",
      "these",
      "give",
      "day",
      "most",
      "us",
      "welcome",
      "advanced",
      "notes",
      "application",
      "here's",
      "rich",
      "text",
      "editing",
      "format",
      "bold",
      "italic",
      "underline",
      "more",
      "features",
      "grammar",
      "checking",
      "auto",
      "glossary",
      "highlighting",
      "note",
      "management",
      "create",
      "edit",
      "delete",
      "pin",
      "important",
      "encryption",
      "protect",
      "sensitive",
      "password",
      "smart",
      "search",
      "find",
      "quickly",
      "intelligent",
      "try",
      "creating",
      "exploring",
      "enhanced",
      "technical",
      "terms",
      "javascript",
      "react",
      "api",
      "database",
      "algorithm",
      "machine",
      "learning",
      "neural",
      "networks",
      "deep",
      "web",
      "html",
      "css",
      "responsive",
      "design",
      "frontend",
      "backend",
      "acronyms",
      "ui",
      "ux",
      "seo",
      "cms",
      "saas",
    ])

    // Check for nonsense words
    let currentPos = 0
    words.forEach((word) => {
      const cleanWord = word.replace(/[^\w]/g, "").toLowerCase()
      const wordStart = text.indexOf(word, currentPos)
      currentPos = wordStart + word.length

      if (cleanWord.length >= 2) {
        const isNonsense = this.isNonsenseWord(cleanWord)
        const isNotCommon = !commonWords.has(cleanWord)

        if (isNonsense && isNotCommon) {
          errors.push({
            text: word,
            start: Math.max(0, wordStart),
            end: wordStart + word.length,
            type: "spelling",
            message: `Possible spelling error: "${word}" may be misspelled`,
            suggestion: this.suggestCorrection(cleanWord),
            rule: "Local Pattern Check",
            category: "Spelling",
          })
        }
      }
    })

    return errors
  }

  // Enhanced fallback summary
  fallbackSummary(text) {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10)
    const words = text.split(/\s+/)
    const wordCount = words.length

    if (sentences.length <= 1) {
      return text.substring(0, 200) + (text.length > 200 ? "..." : "")
    }

    // Identify key topics
    const topics = this.identifyTopics(text)
    const features = this.extractKeyFeatures(text)

    // Create intelligent summary
    const firstSentence = sentences[0].trim()
    const lastSentence = sentences[sentences.length - 1].trim()

    let summary = `${firstSentence}.`

    if (features.length > 0) {
      summary += ` Key features include ${features.slice(0, 3).join(", ")}.`
    }

    if (topics.length > 0) {
      summary += ` This covers ${topics.join(" and ")}.`
    }

    if (sentences.length > 2) {
      summary += ` ${lastSentence}.`
    }

    return summary
  }

  // Enhanced fallback insights
  fallbackInsights(text) {
    const wordCount = text.split(/\s+/).length
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5)
    const readingTime = Math.ceil(wordCount / 200)
    const insights = []

    // Content length insights
    if (wordCount > 500) {
      insights.push({
        type: "suggestion",
        title: "Comprehensive Content",
        message: "This is substantial content. Consider adding headings to improve readability.",
      })
    } else if (wordCount < 50) {
      insights.push({
        type: "info",
        title: "Concise Content",
        message: "This is a brief note. You might want to expand with more details.",
      })
    }

    // Sentence complexity
    const avgWordsPerSentence = Math.round(wordCount / sentences.length) || 0
    if (avgWordsPerSentence > 25) {
      insights.push({
        type: "warning",
        title: "Complex Sentences",
        message: "Some sentences are quite long. Consider breaking them down for clarity.",
      })
    }

    // Content type insights
    const lowerText = text.toLowerCase()
    if (lowerText.includes("code") || lowerText.includes("programming") || lowerText.includes("javascript")) {
      insights.push({
        type: "suggestion",
        title: "Technical Content",
        message: "This appears to be technical content. Consider adding code examples or diagrams.",
      })
    }

    // Always include reading time
    insights.push({
      type: "info",
      title: "Reading Time",
      message: `Estimated reading time: ${readingTime} minute${readingTime !== 1 ? "s" : ""}. Word count: ${wordCount}.`,
    })

    return insights
  }

  // Helper methods
  identifyTopics(text) {
    const topics = []
    const lowerText = text.toLowerCase()

    const topicMap = {
      "note-taking": ["notes", "note", "editing", "text"],
      "web development": ["javascript", "react", "html", "css", "frontend", "backend"],
      "artificial intelligence": ["ai", "machine learning", "neural", "deep learning"],
      "user experience": ["ui", "ux", "user interface", "user experience"],
      "data management": ["database", "data", "search", "management"],
      security: ["encryption", "password", "protect", "security"],
    }

    Object.keys(topicMap).forEach((topic) => {
      const keywords = topicMap[topic]
      const matches = keywords.filter((keyword) => lowerText.includes(keyword))
      if (matches.length >= 2) {
        topics.push(topic)
      }
    })

    return topics
  }

  extractKeyFeatures(text) {
    const features = []
    const lowerText = text.toLowerCase()

    const featurePatterns = [
      { pattern: /rich text editing/i, feature: "rich text editing" },
      { pattern: /grammar checking/i, feature: "grammar checking" },
      { pattern: /auto.?glossary/i, feature: "auto-glossary" },
      { pattern: /note management/i, feature: "note management" },
      { pattern: /encryption/i, feature: "encryption" },
      { pattern: /smart search/i, feature: "smart search" },
      { pattern: /password/i, feature: "password protection" },
      { pattern: /ai features/i, feature: "AI features" },
    ]

    featurePatterns.forEach(({ pattern, feature }) => {
      if (pattern.test(text)) {
        features.push(feature)
      }
    })

    return features.slice(0, 5)
  }

  isNonsenseWord(word) {
    const nonsensePatterns = [
      /^[bcdfghjklmnpqrstvwxyz]{4,}$/i, // Too many consonants
      /^[qwerty]{3,}$/i, // Keyboard patterns
      /^[asdfgh]{3,}$/i,
      /^[zxcvbn]{3,}$/i,
      /(.)\1{2,}/i, // Repeated characters
      /^(hyy|hu|scvv|svv|dfgh|qwer|asdf|zxcv)$/i, // Common nonsense
    ]

    return nonsensePatterns.some((pattern) => pattern.test(word))
  }

  suggestCorrection(word) {
    const corrections = {
      hyy: "hey",
      hu: "how",
      scvv: "save",
      svv: "see",
      teh: "the",
      adn: "and",
      hte: "the",
    }

    return corrections[word] || `Check spelling of "${word}"`
  }

  cleanText(text) {
    return text
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&[a-zA-Z0-9#]+;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  }

  escapeHtml(text) {
    if (typeof document === "undefined") return text // SSR safety
    const div = document.createElement("div")
    div.textContent = text
    return div.innerHTML
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  hashString(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return hash.toString()
  }

  // Legacy compatibility methods
  highlightGlossaryTerms(text) {
    return this.manualGlossaryDetection(text).length > 0
      ? this.applyGlossaryHighlighting(text, this.manualGlossaryDetection(text))
      : text
  }

  getGlossaryDefinition(term) {
    return this.fallbackGlossary[term.toLowerCase()] || null
  }
}

export function AIProvider({ children }) {
  const [aiService] = useState(() => new AIService())
  const [isProcessing, setIsProcessing] = useState(false)

  const checkGrammar = async (text) => {
    setIsProcessing(true)
    try {
      const errors = await aiService.checkGrammar(text)
      return errors
    } catch (error) {
      console.error("❌ AIProvider: Grammar check failed:", error)
      return []
    } finally {
      setIsProcessing(false)
    }
  }

  const autoHighlightGlossary = async (text) => {
    try {
      const result = await aiService.autoHighlightGlossary(text)
      return result
    } catch (error) {
      console.error("❌ AIProvider: Auto glossary failed:", error)
      return text
    }
  }

  const generateSummary = async (text) => {
    setIsProcessing(true)
    try {
      const summary = await aiService.generateSummary(text)
      return summary
    } catch (error) {
      console.error("❌ AIProvider: Summary failed:", error)
      return "Unable to generate summary at this time."
    } finally {
      setIsProcessing(false)
    }
  }

  const getInsights = async (text) => {
    setIsProcessing(true)
    try {
      const insights = await aiService.getInsights(text)
      return insights
    } catch (error) {
      console.error("❌ AIProvider: Insights failed:", error)
      return [
        {
          type: "info",
          title: "Content Analysis",
          message: "Unable to analyze content at this time.",
        },
      ]
    } finally {
      setIsProcessing(false)
    }
  }

  const highlightGlossaryTerms = (text) => {
    return aiService.highlightGlossaryTerms(text)
  }

  const getGlossaryDefinition = (term) => {
    return aiService.getGlossaryDefinition(term)
  }

  const value = {
    isProcessing,
    checkGrammar,
    autoHighlightGlossary,
    generateSummary,
    getInsights,
    highlightGlossaryTerms,
    getGlossaryDefinition,
  }

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>
}

export function useAI() {
  const context = useContext(AIContext)
  if (!context) {
    throw new Error("useAI must be used within an AIProvider")
  }
  return context
}
