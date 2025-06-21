"use client"

import { useEffect, useRef } from "react"

function ColorPalette({ type, isOpen, onColorSelect, onClose }) {
  const paletteRef = useRef(null)

  const textColors = [
    "#000000", "#333333", "#666666", "#999999", "#cccccc",
    "#ff0000", "#ff6600", "#ffcc00", "#00ff00", "#0066ff",
    "#6600ff", "#ff0066", "#8B4513", "#2F4F4F", "#800080"
  ]

  const highlightColors = [
    "transparent", "#fef08a", "#fed7aa", "#fecaca", "#ddd6fe",
    "#bbf7d0", "#bfdbfe", "#f3e8ff", "#fde68a", "#fca5a5",
    "#a78bfa", "#34d399", "#60a5fa", "#f472b6", "#fb7185"
  ]

  const colors = type === "text" ? textColors : highlightColors

  const handleColorClick = (color) => {
    console.log(`🎨 Color palette: ${color} selected for ${type}`)
    onColorSelect(color)
  }

  // Prevent mousedown from stealing focus
  const handleMouseDown = (e) => {
    e.preventDefault()
  }

  if (!isOpen) return null

  return (
    <div 
      ref={paletteRef}
      className="color-palette"
      onMouseDown={handleMouseDown}
    >
      <div className="color-grid">
        {colors.map((color, index) => (
          <button
            key={index}
            className="color-swatch"
            style={{ 
              backgroundColor: color === "transparent" ? "#ffffff" : color,
              border: color === "transparent" ? "2px solid #ccc" : "1px solid #ddd"
            }}
            onClick={() => handleColorClick(color)}
            title={color === "transparent" ? "Remove highlight" : color}
            onMouseDown={handleMouseDown}
          >
            {color === "transparent" && (
              <span style={{ fontSize: "12px", color: "#666" }}>✕</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ColorPalette
