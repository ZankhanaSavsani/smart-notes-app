"use client"

import { useState, useMemo } from "react"
import { useNotes } from "../../contexts/NotesContext"
import NotesList from "./NotesList"
import SearchBar from "./SearchBar"

function Sidebar({ darkMode, setDarkMode, onClose }) {
  const { createNote, notes } = useNotes()
  const [selectedTags, setSelectedTags] = useState([])

  const handleCreateNote = () => {
    createNote()
    // Close sidebar on mobile after creating note
    if (window.innerWidth < 1024) {
      onClose?.()
    }
  }

  // Get all unique tags from all notes
  const allTags = useMemo(() => {
    const tagSet = new Set()
    notes.forEach((note) => {
      if (note.tags && Array.isArray(note.tags)) {
        note.tags.forEach((tag) => tagSet.add(tag))
      }
    })
    return Array.from(tagSet).sort()
  }, [notes])

  const getTagCount = (tag) => {
    return notes.filter((note) => note.tags && note.tags.includes(tag)).length
  }

  const toggleTagFilter = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const clearTagFilters = () => {
    setSelectedTags([])
  }

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <h1>Notes</h1>
        <div className="header-actions">
          <button
            onClick={handleCreateNote}
            className="new-note-btn"
            title="Create new note"
            aria-label="Create new note"
          >
            +
          </button>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="dark-mode-toggle"
            title="Toggle dark mode"
            aria-label="Toggle dark mode"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* Search */}
      <SearchBar />

      {/* Tags Filter */}
      <div className="tags-filter-section">
        <h3 className="tags-filter-title">Filter by Tags</h3>
        <div className="all-tags">
          {allTags.length > 0 ? (
            allTags.map((tag) => (
              <button
                key={tag}
                className={`filter-tag ${selectedTags.includes(tag) ? "active" : ""}`}
                onClick={() => toggleTagFilter(tag)}
              >
                {tag} ({getTagCount(tag)})
              </button>
            ))
          ) : (
            <p className="no-tags">No tags yet. Add tags to your notes to filter them.</p>
          )}
        </div>
        {selectedTags.length > 0 && (
          <button className="clear-filters" onClick={clearTagFilters}>
            Clear Filters ({selectedTags.length})
          </button>
        )}
      </div>

      {/* Notes List */}
      <NotesList onNoteSelect={onClose} selectedTags={selectedTags} />
    </div>
  )
}

export default Sidebar
