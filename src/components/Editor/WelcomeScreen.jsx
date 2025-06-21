"use client"

import { useNotes } from "../../contexts/NotesContext"

function WelcomeScreen() {
  const { createNote } = useNotes()

  return (
    <div className="welcome-screen">
      <div className="welcome-content">
        <h2>Welcome to Notes</h2>
        <p>Your advanced notes application with AI features, encryption, and rich text editing.</p>
        <div className="welcome-features">
          <div className="feature">
            <span className="feature-icon">✨</span>
            <span>Rich Text Editor</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🤖</span>
            <span>AI-Powered Features</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <span>Note Encryption</span>
          </div>
          <div className="feature">
            <span className="feature-icon">📱</span>
            <span>Responsive Design</span>
          </div>
        </div>
        <button onClick={createNote} className="welcome-create-btn">
          Create Your First Note
        </button>
      </div>
    </div>
  )
}

export default WelcomeScreen
