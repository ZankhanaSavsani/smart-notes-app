"use client"

import { useNotes } from "../../contexts/NotesContext"

function SearchBar() {
  const { searchQuery, setSearchQuery } = useNotes()

  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Search notes..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="search-input"
        aria-label="Search notes"
      />
    </div>
  )
}

export default SearchBar
