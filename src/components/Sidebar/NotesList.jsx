"use client"

import { useNotes } from "../../contexts/NotesContext"
import NoteItem from "./NoteItem"

function NotesList({ onNoteSelect, selectedTags = [] }) {
  const { notes, searchQuery, createNote } = useNotes()

  // Ensure notes is always an array
  const safeNotes = Array.isArray(notes) ? notes : []

  // Sort notes (pinned first, then by update date)
  const sortedNotes = [...safeNotes].sort((a, b) => {
    // Pinned notes first
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1

    // Then by update date
    return new Date(b.updatedAt) - new Date(a.updatedAt)
  })

  // Filter notes by search query
  const searchFilteredNotes = searchQuery
    ? sortedNotes.filter((note) => {
        if (!note) return false

        // For encrypted notes, only search by creation date or tags
        if (note.isEncrypted) {
          const tagsMatch = note.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          const dateMatch = new Date(note.createdAt)
            .toLocaleDateString()
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
          return tagsMatch || dateMatch
        }

        // For unencrypted notes, search title and content
        const titleMatch = note.title?.toLowerCase().includes(searchQuery.toLowerCase())
        const contentMatch = note.content?.toLowerCase().includes(searchQuery.toLowerCase())
        const tagsMatch = note.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

        return titleMatch || contentMatch || tagsMatch
      })
    : sortedNotes

  // Filter notes by selected tags
  const tagFilteredNotes =
    selectedTags.length > 0
      ? searchFilteredNotes.filter((note) => {
          if (!note || !note.tags || !Array.isArray(note.tags)) return false
          return selectedTags.every((selectedTag) => note.tags.includes(selectedTag))
        })
      : searchFilteredNotes

  // Handle empty states
  if (tagFilteredNotes.length === 0) {
    return (
      <div className="no-notes">
        <p>
          {selectedTags.length > 0
            ? "No notes match the selected tags"
            : searchQuery
              ? "No notes match your search"
              : "No notes yet"}
        </p>
        <button onClick={() => createNote()} className="create-first-note">
          Create your first note
        </button>
      </div>
    )
  }

  return (
    <div className="notes-list">
      {tagFilteredNotes.map((note) => {
        // Safety check for note object
        if (!note || !note.id) {
          console.warn("Invalid note object:", note)
          return null
        }

        return <NoteItem key={note.id} note={note} onSelect={onNoteSelect} />
      })}
    </div>
  )
}

export default NotesList
