"use client"

import { useState } from "react"

function PasswordModal({ isOpen, onClose, onSubmit, isLoading = false, title = "Enter Password" }) {
  const [password, setPassword] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!password.trim()) return
    onSubmit(password)
  }

  const handleClose = () => {
    setPassword("")
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>🔒 {title}</h3>
          <button onClick={handleClose} className="close-btn">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p>This note is encrypted. Please enter your password to view it.</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="password-input"
              autoFocus
              disabled={isLoading}
            />
          </div>
          <div className="modal-footer">
            <button type="button" onClick={handleClose} className="btn-secondary" disabled={isLoading}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={isLoading || !password.trim()}>
              {isLoading ? "Decrypting..." : "Decrypt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PasswordModal
