"use client"

import { useState, useEffect, useRef } from "react"
import { useNotes } from "../../contexts/NotesContext"
import { useAI } from "../../contexts/AIContext"
import Toolbar from "./Toolbar"
import EditorContent from "./EditorContent"
import EditorFooter from "./EditorFooter"
import { getWordCount, getCharCount } from "../../utils/textUtils"

/**
 * Rich Text Editor Component
 *
 * The main editor interface that handles note editing, auto-save, AI features,
 * and encryption. This component orchestrates all the editing functionality
 * and provides a seamless writing experience.
 */
function RichTextEditor({ note }) {
  const { updateNote, decryptNote } = useNotes()
  const { checkGrammar, autoHighlightGlossary, highlightGlossaryTerms } = useAI()

  // Local state for real-time editing before auto-save
  const [title, setTitle] = useState(note.title || "")
  const [content, setContent] = useState(note.content || "")

  // AI feature states
  const [grammarErrors, setGrammarErrors] = useState([])
  const [isCheckingGrammar, setIsCheckingGrammar] = useState(false)
  const [isAutoGlossaryEnabled, setIsAutoGlossaryEnabled] = useState(true)

  // Encryption modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState("")
  const [isDecrypting, setIsDecrypting] = useState(false)

  // Refs for managing timeouts (prevents memory leaks)
  const saveTimeoutRef = useRef(null)
  const glossaryTimeoutRef = useRef(null)

  // Tag management state
  const [tagInput, setTagInput] = useState("")

  /**
   * Handle tag input with keyboard shortcuts
   * Enter or comma adds tags, backspace removes last tag
   */
  const handleTagKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault()
      addTag(tagInput.trim())
      setTagInput("")
    } else if (e.key === "Backspace" && !tagInput && note.tags && note.tags.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      removeTag(note.tags[note.tags.length - 1])
    }
  }

  // Add tag with validation and sanitization
  const addTag = (tagText) => {
    if (!tagText || note.isEncrypted) return

    const currentTags = note.tags || []
    // Clean tag text: lowercase, remove special chars, trim
    const newTag = tagText
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()

    // Only add if tag doesn't already exist
    if (newTag && !currentTags.includes(newTag)) {
      const updatedTags = [...currentTags, newTag]
      updateNote(note.id, { tags: updatedTags })
    }
  }

  // Remove specific tag from note
  const removeTag = (tagToRemove) => {
    if (note.isEncrypted) return

    const currentTags = note.tags || []
    const updatedTags = currentTags.filter((tag) => tag !== tagToRemove)
    updateNote(note.id, { tags: updatedTags })
  }

  // Sync local state when switching between notes
  useEffect(() => {
    setTitle(note.title || "")
    setContent(note.content || "")
  }, [note.id])

  /**
   * Auto-save functionality with debouncing
   * Saves changes 500ms after user stops typing
   */
  useEffect(() => {
    // Don't auto-save encrypted notes (they can't be edited anyway)
    if (note.isEncrypted) {
      return
    }

    // Clear previous timeout to debounce saves
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    saveTimeoutRef.current = setTimeout(() => {
      // Only save if content actually changed
      if (title !== note.title || content !== note.content) {
        const wordCount = getWordCount(content)
        const charCount = getCharCount(content)

        updateNote(note.id, {
          title: title || "Untitled",
          content,
          wordCount,
          charCount,
        })
      }
    }, 500)

    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [title, content, note.id, note.title, note.content, note.isEncrypted, updateNote])

  /**
   * Auto Glossary Highlighting
   * Automatically highlights technical terms after user stops typing
   */
  useEffect(() => {
    // Skip if disabled, encrypted, or content too short
    if (!isAutoGlossaryEnabled || note.isEncrypted || !content || content.length < 50) {
      return
    }

    if (glossaryTimeoutRef.current) {
      clearTimeout(glossaryTimeoutRef.current)
    }

    // Wait 2 seconds after user stops typing to avoid interrupting flow
    glossaryTimeoutRef.current = setTimeout(async () => {
      try {
        const highlightedContent = await autoHighlightGlossary(content)
        if (highlightedContent !== content) {
          setContent(highlightedContent)
        }
      } catch (error) {
        console.error("❌ Auto glossary highlighting failed:", error)
      }
    }, 2000)

    return () => {
      if (glossaryTimeoutRef.current) {
        clearTimeout(glossaryTimeoutRef.current)
      }
    }
  }, [content, isAutoGlossaryEnabled, note.isEncrypted, autoHighlightGlossary])

  /**
   * Grammar checking with visual highlighting
   * Checks grammar and applies visual indicators in the editor
   */
  const handleGrammarCheck = async () => {
    if (!content.trim()) {
      alert("No content to check for grammar")
      return
    }

    setIsCheckingGrammar(true)
    try {
      const errors = await checkGrammar(content)

      setGrammarErrors(errors)

      // Apply visual highlighting to the editor
      if (errors.length > 0) {
        highlightGrammarErrors(errors)
      } else {
        clearGrammarHighlights()
        alert("No grammar errors found! 🎉")
      }
    } catch (error) {
      console.error("❌ Grammar check failed:", error)
      alert("Grammar check failed. Please try again.")
    } finally {
      setIsCheckingGrammar(false)
    }
  }

  /**
   * Apply visual highlighting for grammar errors
   * Creates tooltips and red underlines for errors
   */
  const highlightGrammarErrors = (errors) => {
    const editor = document.querySelector(".editor-content")
    if (!editor) return

    // Sort errors by position (descending) to avoid position shifts when replacing
    const sortedErrors = [...errors].sort((a, b) => b.start - a.start)
    let highlightedContent = editor.innerHTML

    sortedErrors.forEach((error, index) => {
      try {
        const errorId = `grammar-error-${index}`

        // Create highlighted span with tooltip
        const highlightSpan = `<span class="grammar-error" data-error-id="${errorId}">
          ${error.text}
          <span class="grammar-tooltip">
            <strong>Error:</strong> ${error.message}<br>
            <span class="grammar-suggestion">Suggestion: ${error.suggestion}</span>
          </span>
        </span>`

        // Replace error text with highlighted version
        const errorRegex = new RegExp(escapeRegExp(error.text), "g")
        let replacementCount = 0

        highlightedContent = highlightedContent.replace(errorRegex, (match) => {
          replacementCount++
          // Only replace first occurrence to match error position
          if (replacementCount === 1) {
            return highlightSpan
          }
          return match
        })
      } catch (err) {
        console.error("❌ Error highlighting grammar error:", err)
      }
    })

    editor.innerHTML = highlightedContent
  }

  // Remove all grammar error highlights from editor
  const clearGrammarHighlights = () => {
    const editor = document.querySelector(".editor-content")
    if (!editor) return

    const errorElements = editor.querySelectorAll(".grammar-error")
    errorElements.forEach((element) => {
      const parent = element.parentNode
      parent.replaceChild(document.createTextNode(element.textContent), element)
      parent.normalize() // Merge adjacent text nodes
    })
  }

  // Utility function to escape regex special characters
  const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  // Handle title changes with encryption check
  const handleTitleChange = (newTitle) => {
    if (note.isEncrypted) {
      return
    }
    setTitle(newTitle)
  }

  // Handle content changes with grammar error clearing
  const handleContentChange = (newContent) => {
    if (note.isEncrypted) {
      return
    }
    setContent(newContent)
    // Clear grammar errors when content changes
    if (grammarErrors.length > 0) {
      setGrammarErrors([])
      clearGrammarHighlights()
    }
  }

  // Toggle auto-glossary feature
  const toggleAutoGlossary = () => {
    setIsAutoGlossaryEnabled(!isAutoGlossaryEnabled)
  }

  // Encryption modal handlers
  const handleDecryptClick = () => {
    setShowPasswordModal(true)
  }

  const handleDecryptSubmit = async (e) => {
    e.preventDefault()
    if (!password.trim()) return

    setIsDecrypting(true)
    try {
      const success = await decryptNote(note.id, password)
      if (success) {
        setShowPasswordModal(false)
        setPassword("")
      }
    } finally {
      setIsDecrypting(false)
    }
  }

  const handleModalClose = () => {
    setShowPasswordModal(false)
    setPassword("")
  }

  // Render encrypted note interface
  if (note.isEncrypted) {
    return (
      <div className="editor-container">
        <div className="encrypted-note">
          <div className="encrypted-content">
            <span className="lock-icon">🔒</span>
            <h3>This note is encrypted</h3>
            <p>Enter your password to view and edit this note.</p>
            <button className="decrypt-btn" onClick={handleDecryptClick}>
              Decrypt Note
            </button>
          </div>
        </div>

        {/* Password Modal for decryption */}
        {showPasswordModal && (
          <div className="modal-overlay" onClick={handleModalClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>🔒 Enter Password</h3>
                <button onClick={handleModalClose} className="close-btn">
                  ×
                </button>
              </div>
              <form onSubmit={handleDecryptSubmit}>
                <div className="modal-body">
                  <p>This note is encrypted. Please enter your password to view it.</p>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="password-input"
                    autoFocus
                    disabled={isDecrypting}
                  />
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={handleModalClose} className="btn-secondary" disabled={isDecrypting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={isDecrypting || !password.trim()}>
                    {isDecrypting ? "Decrypting..." : "Decrypt"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render main editor interface
  return (
    <div className="editor-container">
      {/* Note title and metadata section */}
      <div className="editor-header">
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Note title..."
          className="title-input"
          aria-label="Note title"
        />

        {/* Tags input with keyboard shortcuts */}
        <div className="tags-section-compact">
          <div className="tags-input-container">
            <input
              type="text"
              placeholder="Add tags (press Enter or comma to add)..."
              className="tags-input"
              onKeyDown={handleTagKeyDown}
              onChange={(e) => setTagInput(e.target.value)}
              value={tagInput}
              disabled={note.isEncrypted}
            />
          </div>
          <div className="tags-display">
            {(note.tags || []).map((tag, index) => (
              <span key={index} className="tag">
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="tag-remove"
                  disabled={note.isEncrypted}
                  aria-label={`Remove ${tag} tag`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Auto-glossary toggle switch */}
        <div className="auto-glossary-toggle-compact">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={isAutoGlossaryEnabled}
              onChange={toggleAutoGlossary}
              className="toggle-checkbox"
            />
            <span className="toggle-slider"></span>
            <span className="toggle-text">🎯 Auto Glossary</span>
          </label>
        </div>
      </div>

      {/* Rich text editor with toolbar */}
      <div className="rich-text-editor">
        <Toolbar
          onGrammarCheck={handleGrammarCheck}
          isCheckingGrammar={isCheckingGrammar}
          grammarErrors={grammarErrors}
        />

        {/* Scrollable editor content area */}
        <div className="editor-content-wrapper">
          <EditorContent
            content={content}
            onChange={handleContentChange}
            grammarErrors={grammarErrors}
            highlightGlossaryTerms={highlightGlossaryTerms}
          />
        </div>
      </div>

      {/* Footer with note statistics and metadata */}
      <EditorFooter note={note} content={content} />
    </div>
  )
}

export default RichTextEditor
