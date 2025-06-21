"use client"

import { useEffect } from "react"

function Notification({ message, type = "info", onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✅"
      case "error":
        return "❌"
      case "warning":
        return "⚠️"
      default:
        return "ℹ️"
    }
  }

  return (
    <div className={`notification ${type}`}>
      <span className="notification-icon">{getIcon()}</span>
      <div className="notification-content">{message}</div>
      <button onClick={onClose} className="close-btn" aria-label="Close notification">
        ×
      </button>
    </div>
  )
}

export default Notification
