"use client"

import { useState } from "react"
import { useNotes } from "../../contexts/NotesContext"
import { useAI } from "../../contexts/AIContext"
import { getWordCount, getCharCount } from "../../utils/textUtils"

function EditorFooter({ note, content }) {
  const { encryptNote } = useNotes()
  const { generateSummary, getInsights } = useAI()
  const [showSummary, setShowSummary] = useState(false)
  const [showInsights, setShowInsights] = useState(false)
  const [showEncryptModal, setShowEncryptModal] = useState(false)
  const [summary, setSummary] = useState("")
  const [insights, setInsights] = useState([])
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const wordCount = getWordCount(content || "")
  const charCount = getCharCount(content || "")
  const readingTime = Math.ceil(wordCount / 200) // Assuming 200 words per minute

  const handleSummary = async () => {
    if (!content || content.length < 50) {
      alert("Content is too short to summarize")
      return
    }

    setIsProcessing(true)
    try {
      const generatedSummary = await generateSummary(content)
      setSummary(generatedSummary)
      setShowSummary(true)
    } catch (error) {
      console.error("❌ Summary generation failed:", error)
      alert("Failed to generate summary. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleInsights = async () => {
    if (!content || content.length < 50) {
      alert("Content is too short to analyze")
      return
    }

    setIsProcessing(true)
    try {
      const generatedInsights = await getInsights(content)
      setInsights(generatedInsights)
      setShowInsights(true)
    } catch (error) {
      console.error("❌ Insights generation failed:", error)
      alert("Failed to generate insights. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEncrypt = () => {
    if (note?.isEncrypted) {
      alert("Note is already encrypted")
      return
    }
    setShowEncryptModal(true)
  }

  const handleEncryptSubmit = async (e) => {
    e.preventDefault()

    if (!password.trim()) {
      alert("Please enter a password")
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long")
      return
    }

    setIsProcessing(true)
    try {
      const success = await encryptNote(note.id, password)
      if (success) {
        setShowEncryptModal(false)
        setPassword("")
        setConfirmPassword("")
      }
    } catch (error) {
      console.error("❌ Encryption failed:", error)
      alert("Failed to encrypt note. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleModalClose = () => {
    setShowSummary(false)
    setShowInsights(false)
    setShowEncryptModal(false)
    setPassword("")
    setConfirmPassword("")
  }

  return (
    <>
      <div className="editor-footer">
        <div className="stats">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span>{readingTime} min read</span>
          <span className="saved-indicator">✓ Saved</span>
        </div>

        <div className="footer-actions">
          <button
            className="footer-btn"
            onClick={handleSummary}
            disabled={!content || content.length < 50 || isProcessing}
          >
            {isProcessing ? "⏳" : "📄"} Summary
          </button>
          <button
            className="footer-btn"
            onClick={handleInsights}
            disabled={!content || content.length < 50 || isProcessing}
          >
            {isProcessing ? "⏳" : "💡"} Insights
          </button>
          <button className="footer-btn" onClick={handleEncrypt} disabled={note?.isEncrypted || isProcessing}>
            {note?.isEncrypted ? "🔒 Encrypted" : "🔐 Encrypt"}
          </button>
        </div>
      </div>

      {/* Summary Modal */}
      {showSummary && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📄 Summary</h3>
              <button onClick={handleModalClose} className="close-btn">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="summary-content">{summary}</div>
            </div>
            <div className="modal-footer">
              <button onClick={handleModalClose} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Insights Modal */}
      {showInsights && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>💡 Insights</h3>
              <button onClick={handleModalClose} className="close-btn">
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="insights-content">
                {insights.map((insight, index) => (
                  <div key={index} className={`insight-item insight-${insight.type}`}>
                    <div className="insight-header">
                      <span className="insight-icon">
                        {insight.type === "warning" ? "⚠️" : insight.type === "suggestion" ? "💡" : "ℹ️"}
                      </span>
                      <strong>{insight.title}</strong>
                    </div>
                    <p>{insight.message}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleModalClose} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Encrypt Modal */}
      {showEncryptModal && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔐 Encrypt Note</h3>
              <button onClick={handleModalClose} className="close-btn">
                ×
              </button>
            </div>
            <form onSubmit={handleEncryptSubmit}>
              <div className="modal-body">
                <p>Encrypt this note with a password. You'll need this password to view the note later.</p>
                <div className="form-group">
                  <label>Password:</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min 6 characters)..."
                    className="password-input"
                    autoFocus
                    disabled={isProcessing}
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password:</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password..."
                    className="password-input"
                    disabled={isProcessing}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={handleModalClose} className="btn-secondary" disabled={isProcessing}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isProcessing || !password.trim() || !confirmPassword.trim()}
                >
                  {isProcessing ? "Encrypting..." : "Encrypt Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default EditorFooter
