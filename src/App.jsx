"use client"

import { useState, useEffect } from "react"
import { NotesProvider } from "./contexts/NotesContext"
import { AIProvider } from "./contexts/AIContext"
import Sidebar from "./components/Sidebar/Sidebar"
import MainEditor from "./components/Editor/MainEditor"
import Notification from "./components/UI/Notification"
import { useLocalStorage } from "./hooks/useLocalStorage"
import "./index.css"

/**
 * Main App Component
 *
 * This is the root component that orchestrates the entire notes application.
 * It manages global state like dark mode, sidebar visibility, and notifications.
 * The component also handles keyboard shortcuts and responsive behavior.
 */
function App() {
  // Persistent dark mode setting using localStorage
  const [darkMode, setDarkMode] = useLocalStorage("darkMode", false)

  // Sidebar state - starts closed on mobile, open on desktop
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Global notification system for user feedback
  const [notification, setNotification] = useState(null)

  // Handle responsive sidebar behavior based on screen size
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleResize = () => {
      // Auto-open sidebar on desktop, close on mobile
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true)
      } else {
        setSidebarOpen(false)
      }
    }

    // Set initial state based on current screen size
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Apply dark mode class to document body for global styling
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.body.className = darkMode ? "dark" : ""
    }
  }, [darkMode])

  // Centralized notification system for the entire app
  const showNotification = (message, type = "info", duration = 3000) => {
    setNotification({ message, type, id: Date.now() })
    setTimeout(() => setNotification(null), duration)
  }

  // Global keyboard shortcuts for better user experience
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleKeyDown = (e) => {
      // Toggle sidebar with Ctrl/Cmd + B (common in IDEs)
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault()
        setSidebarOpen((prev) => !prev)
      }

      // Toggle dark mode with Ctrl/Cmd + D
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault()
        setDarkMode((prev) => !prev)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [setDarkMode])

  return (
    // Wrap entire app with context providers for state management
    <AIProvider>
      <NotesProvider showNotification={showNotification}>
        <div className={`app ${darkMode ? "dark" : ""}`}>
          {/* Mobile hamburger menu button - only visible on small screens */}
          <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          {/* Collapsible sidebar with notes list and controls */}
          <div className={`sidebar-container ${sidebarOpen ? "open" : "closed"}`}>
            <Sidebar darkMode={darkMode} setDarkMode={setDarkMode} onClose={() => setSidebarOpen(false)} />
          </div>

          {/* Mobile overlay to close sidebar when clicking outside */}
          {sidebarOpen && typeof window !== "undefined" && window.innerWidth < 1024 && (
            <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
          )}

          {/* Main content area with the note editor */}
          <div className="main-container">
            <MainEditor darkMode={darkMode} />
          </div>

          {/* Global notification system for user feedback */}
          {notification && (
            <Notification
              message={notification.message}
              type={notification.type}
              onClose={() => setNotification(null)}
            />
          )}
        </div>
      </NotesProvider>
    </AIProvider>
  )
}

export default App
