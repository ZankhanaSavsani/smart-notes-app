"use client"

import { useNotes } from "../../contexts/NotesContext"
import { extractPlainText, formatDate, truncateText } from "../../utils/textUtils"

function NoteItem({ note, onSelect }) {
  const { currentNote, setCurrentNote, togglePin, deleteNote } = useNotes()

  const handleSelect = () => {
    setCurrentNote(note.id)
    // Close sidebar on mobile after selecting note
    if (window.innerWidth < 1024) {
      onSelect?.()
    }
  }

  const handlePin = (e) => {
    e.stopPropagation()
    togglePin(note.id)
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (window.confirm("Are you sure you want to delete this note?")) {
      deleteNote(note.id)
    }
  }

  const isActive = currentNote?.id === note.id

  // Handle encrypted notes differently
  let displayTitle = note.title || "Untitled"
  let preview = ""

  if (note.isEncrypted) {
    displayTitle = "🔒 Encrypted Note"
    preview = "This note is encrypted. Click to decrypt and view."
  } else {
    const plainContent = extractPlainText(note.content)
    preview = truncateText(plainContent, 100)
  }

  return (
    <div
      className={`note-item ${isActive ? "active" : ""}`}
      onClick={handleSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleSelect()
        }
      }}
    >
      <div className="note-header">
        <h3 className="note-title">
          {note.isPinned && (
            <span className="pin-icon" aria-label="Pinned">
              📌
            </span>
          )}
          {/* REMOVED: Duplicate lock icon from here since it's already in displayTitle */}
          {displayTitle}
        </h3>
        <div className="note-actions">
          <button
            onClick={handlePin}
            className={`action-btn ${note.isPinned ? "pinned" : ""}`}
            title={note.isPinned ? "Unpin note" : "Pin note"}
            aria-label={note.isPinned ? "Unpin note" : "Pin note"}
          >
            {note.isPinned ? "📌" : "📍"}
          </button>
          <button onClick={handleDelete} className="action-btn delete" title="Delete note" aria-label="Delete note">
            🗑️
          </button>
        </div>
      </div>
      <p className="note-preview">{preview}</p>
      <div className="note-footer">
        <span className="note-date">{formatDate(note.updatedAt)}</span>
        {!note.isEncrypted && note.wordCount > 0 && <span className="word-count">{note.wordCount} words</span>}
        {note.isEncrypted && <span className="encrypted-badge">Encrypted</span>}
      </div>
    </div>
  )
}

export default NoteItem
