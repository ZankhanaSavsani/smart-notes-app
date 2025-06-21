"use client"

import { createContext, useContext, useReducer, useEffect } from "react"
import { useLocalStorage } from "../hooks/useLocalStorage"
import { encryptText, decryptText } from "../utils/encryption"
import { getWordCount, getCharCount } from "../utils/textUtils"

const NotesContext = createContext()

// Action types for the reducer - keeps state updates predictable
const ACTIONS = {
  SET_NOTES: "SET_NOTES",
  ADD_NOTE: "ADD_NOTE",
  UPDATE_NOTE: "UPDATE_NOTE",
  DELETE_NOTE: "DELETE_NOTE",
  SET_CURRENT_NOTE: "SET_CURRENT_NOTE",
  SET_SEARCH_QUERY: "SET_SEARCH_QUERY",
  TOGGLE_PIN: "TOGGLE_PIN",
  SET_LOADING: "SET_LOADING",
  SET_ERROR: "SET_ERROR",
  SET_NOTIFICATION: "SET_NOTIFICATION",
  CLEAR_NOTIFICATION: "CLEAR_NOTIFICATION",
}

// Initial state structure for the notes application
const initialState = {
  notes: [],
  currentNoteId: null,
  searchQuery: "",
  loading: false,
  error: null,
  notification: null,
}

/**
 * Notes Reducer
 *
 * Handles all state updates for the notes application using the reducer pattern.
 * This ensures predictable state changes and makes debugging easier.
 */
function notesReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_NOTES:
      // Ensure notes is always an array to prevent runtime errors
      return { ...state, notes: Array.isArray(action.payload) ? action.payload : [], loading: false }

    case ACTIONS.ADD_NOTE:
      // Add new note to the beginning and set it as current
      return {
        ...state,
        notes: [action.payload, ...state.notes],
        currentNoteId: action.payload.id,
      }

    case ACTIONS.UPDATE_NOTE:
      // Update specific note while preserving others
      return {
        ...state,
        notes: state.notes.map((note) =>
          note.id === action.payload.id ? { ...note, ...action.payload.updates } : note,
        ),
      }

    case ACTIONS.DELETE_NOTE:
      // Remove note and handle current note selection
      const filteredNotes = state.notes.filter((note) => note.id !== action.payload)
      const newCurrentId =
        state.currentNoteId === action.payload
          ? filteredNotes.length > 0
            ? filteredNotes[0].id
            : null
          : state.currentNoteId

      return {
        ...state,
        notes: filteredNotes,
        currentNoteId: newCurrentId,
      }

    case ACTIONS.SET_CURRENT_NOTE:
      return { ...state, currentNoteId: action.payload }

    case ACTIONS.SET_SEARCH_QUERY:
      return { ...state, searchQuery: action.payload }

    case ACTIONS.TOGGLE_PIN:
      // Toggle pin status for a specific note
      return {
        ...state,
        notes: state.notes.map((note) => (note.id === action.payload ? { ...note, isPinned: !note.isPinned } : note)),
      }

    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload }

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false }

    case ACTIONS.SET_NOTIFICATION:
      return { ...state, notification: action.payload }

    case ACTIONS.CLEAR_NOTIFICATION:
      return { ...state, notification: null }

    default:
      return state
  }
}

/**
 * Notes Provider Component
 *
 * Provides notes state and actions to the entire application.
 * Handles localStorage persistence, note operations, and encryption.
 */
export function NotesProvider({ children, showNotification }) {
  const [state, dispatch] = useReducer(notesReducer, initialState)
  const [storedNotes, setStoredNotes] = useLocalStorage("notes", [])

  // Auto-clear notifications after 3 seconds
  useEffect(() => {
    if (state.notification) {
      const timer = setTimeout(() => {
        dispatch({ type: ACTIONS.CLEAR_NOTIFICATION })
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [state.notification])

  // Internal notification system that works with external notifications
  const showNotificationInternal = (message, type = "success") => {
    dispatch({
      type: ACTIONS.SET_NOTIFICATION,
      payload: { message, type },
    })
    // Also trigger external notification system if provided
    showNotification?.(message, type)
  }

  // Load notes from localStorage on app startup
  useEffect(() => {
    try {
      dispatch({ type: ACTIONS.SET_LOADING, payload: true })

      if (!Array.isArray(storedNotes) || storedNotes.length === 0) {
        // Create a welcome note for new users to demonstrate features
        const welcomeNote = {
          id: Date.now().toString(),
          title: "Welcome to Notes! 🎉",
          content: `<p>Welcome to your advanced notes application! Here's what you can do:</p>
            <ul>
              <li><strong>Rich Text Editing:</strong> Format your text with bold, italic, underline, and more</li>
              <li><strong>AI Features:</strong> Get grammar checking and auto-glossary highlighting</li>
              <li><strong>Note Management:</strong> Create, edit, delete, and pin important notes</li>
              <li><strong>Encryption:</strong> Protect sensitive notes with password encryption</li>
              <li><strong>Smart Search:</strong> Find notes quickly with intelligent search</li>
            </ul>
            <p>Try creating a new note or exploring the features!</p>`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isPinned: true,
          isEncrypted: false,
          tags: ["welcome", "tutorial"],
          wordCount: 85,
          charCount: 520,
        }

        const initialNotes = [welcomeNote]
        setStoredNotes(initialNotes)
        dispatch({ type: ACTIONS.SET_NOTES, payload: initialNotes })
        dispatch({ type: ACTIONS.SET_CURRENT_NOTE, payload: welcomeNote.id })
      } else {
        // Load existing notes and select the first one
        dispatch({ type: ACTIONS.SET_NOTES, payload: storedNotes })
        if (storedNotes.length > 0) {
          dispatch({ type: ACTIONS.SET_CURRENT_NOTE, payload: storedNotes[0].id })
        }
      }
    } catch (error) {
      dispatch({ type: ACTIONS.SET_ERROR, payload: "Failed to load notes" })
      showNotificationInternal("Failed to load notes", "error")
    }
  }, [])

  // Persist notes to localStorage whenever they change
  useEffect(() => {
    if (Array.isArray(state.notes) && state.notes.length >= 0) {
      setStoredNotes(state.notes)
    }
  }, [state.notes, setStoredNotes])

  // Note creation with default values and metadata
  const createNote = (noteData = {}) => {
    try {
      const newNote = {
        id: Date.now().toString(), // Simple ID generation
        title: noteData.title || "Untitled Note",
        content: noteData.content || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPinned: false,
        isEncrypted: false,
        tags: noteData.tags || [],
        wordCount: 0,
        charCount: 0,
        ...noteData, // Allow overriding defaults
      }

      dispatch({ type: ACTIONS.ADD_NOTE, payload: newNote })
      showNotificationInternal("Note created successfully", "success")
      return newNote
    } catch (error) {
      showNotificationInternal("Failed to create note", "error")
    }
  }

  // Update note with automatic metadata updates
  const updateNote = (id, updates) => {
    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(), // Always update timestamp
      }

      // Calculate word/character count for unencrypted content
      if (updates.content !== undefined && !updates.isEncrypted) {
        updatedData.wordCount = getWordCount(updates.content)
        updatedData.charCount = getCharCount(updates.content)
      }

      dispatch({
        type: ACTIONS.UPDATE_NOTE,
        payload: { id, updates: updatedData },
      })
    } catch (error) {
      showNotificationInternal("Failed to update note", "error")
    }
  }

  // Delete note with user feedback
  const deleteNote = (id) => {
    try {
      dispatch({ type: ACTIONS.DELETE_NOTE, payload: id })
      showNotificationInternal("Note deleted successfully", "success")
    } catch (error) {
      showNotificationInternal("Failed to delete note", "error")
    }
  }

  // Toggle pin status with smart feedback
  const togglePin = (id) => {
    try {
      dispatch({ type: ACTIONS.TOGGLE_PIN, payload: id })
      const note = state.notes.find((n) => n.id === id)
      const message = note?.isPinned ? "Note unpinned" : "Note pinned"
      showNotificationInternal(message, "success")
    } catch (error) {
      showNotificationInternal("Failed to update note", "error")
    }
  }

  // Encrypt note with password protection
  const encryptNote = async (id, password) => {
    try {
      const note = state.notes.find((n) => n.id === id)
      if (!note) {
        throw new Error("Note not found")
      }

      if (note.isEncrypted) {
        showNotificationInternal("Note is already encrypted", "warning")
        return false
      }

      // Encrypt both title and content
      const titleToEncrypt = note.title || "Untitled Note"
      const contentToEncrypt = note.content || " "

      const encryptedTitle = await encryptText(titleToEncrypt, password)
      const encryptedContent = await encryptText(contentToEncrypt, password)

      const encryptedData = {
        title: encryptedTitle,
        content: encryptedContent,
        isEncrypted: true,
        encryptedAt: new Date().toISOString(),
        wordCount: 0, // Hide stats for encrypted notes
        charCount: 0,
      }

      dispatch({
        type: ACTIONS.UPDATE_NOTE,
        payload: { id, updates: encryptedData },
      })

      showNotificationInternal("Note encrypted successfully", "success")
      return true
    } catch (error) {
      showNotificationInternal("Failed to encrypt note: " + error.message, "error")
      return false
    }
  }

  // Decrypt note with password verification
  const decryptNote = async (id, password) => {
    try {
      const note = state.notes.find((n) => n.id === id)
      if (!note || !note.isEncrypted) {
        throw new Error("Note not found or not encrypted")
      }

      // Attempt to decrypt both title and content
      const decryptedTitle = await decryptText(note.title, password)
      const decryptedContent = await decryptText(note.content, password)

      const decryptedData = {
        title: decryptedTitle,
        content: decryptedContent,
        isEncrypted: false,
        decryptedAt: new Date().toISOString(),
        wordCount: getWordCount(decryptedContent),
        charCount: getCharCount(decryptedContent),
      }

      updateNote(id, decryptedData)
      showNotificationInternal("Note decrypted successfully", "success")
      return true
    } catch (error) {
      showNotificationInternal("Failed to decrypt note - check your password", "error")
      return false
    }
  }

  // Simple state setters
  const setCurrentNote = (id) => {
    dispatch({ type: ACTIONS.SET_CURRENT_NOTE, payload: id })
  }

  const setSearchQuery = (query) => {
    dispatch({ type: ACTIONS.SET_SEARCH_QUERY, payload: query })
  }

  // Computed values for easy access in components
  const currentNote = state.notes.find((note) => note.id === state.currentNoteId) || null

  // Smart search that handles encrypted notes differently
  const filteredNotes = state.notes.filter((note) => {
    if (!state.searchQuery.trim()) return true

    const query = state.searchQuery.toLowerCase()

    // For encrypted notes, only search metadata (tags, dates)
    if (note.isEncrypted) {
      const tagsMatch = note.tags?.some((tag) => tag.toLowerCase().includes(query))
      const dateMatch = new Date(note.createdAt).toLocaleDateString().toLowerCase().includes(query)
      return tagsMatch || dateMatch
    }

    // For unencrypted notes, search everything
    const titleMatch = note.title.toLowerCase().includes(query)
    const contentMatch = note.content.toLowerCase().includes(query)
    const tagsMatch = note.tags?.some((tag) => tag.toLowerCase().includes(query))

    return titleMatch || contentMatch || tagsMatch
  })

  // Sort notes with pinned notes first, then by update date
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.updatedAt) - new Date(a.updatedAt)
  })

  // Utility functions for components that need specific data
  const getSelectedNote = () => currentNote
  const getFilteredNotes = () => filteredNotes
  const getPinnedNotes = () => state.notes.filter((note) => note.isPinned)
  const getRecentNotes = () =>
    [...state.notes].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5)

  // Context value with all state and actions
  const value = {
    // State
    ...state,
    currentNote,
    filteredNotes,
    sortedNotes,

    // Actions
    createNote,
    updateNote,
    deleteNote,
    togglePin,
    encryptNote,
    decryptNote,
    setCurrentNote,
    setSearchQuery,
    showNotification: showNotificationInternal,

    // Utility functions
    getSelectedNote,
    getFilteredNotes,
    getPinnedNotes,
    getRecentNotes,
  }

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>
}

// Custom hook for accessing notes context
export function useNotes() {
  const context = useContext(NotesContext)
  if (!context) {
    throw new Error("useNotes must be used within a NotesProvider")
  }
  return context
}
