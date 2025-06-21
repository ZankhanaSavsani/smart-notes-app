"use client"

import { useState, useEffect, useRef } from "react"
import ColorPalette from "./ColorPalette"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

function Toolbar({ onGrammarCheck, isCheckingGrammar, grammarErrors }) {
  const [activeFormats, setActiveFormats] = useState(new Set())
  const [showTextColorPalette, setShowTextColorPalette] = useState(false)
  const [showHighlightPalette, setShowHighlightPalette] = useState(false)
  const [currentTextColor, setCurrentTextColor] = useState("#000000")
  const [currentHighlightColor, setCurrentHighlightColor] = useState("#fef08a")

  // Store the selection when color palette is opened
  const storedSelectionRef = useRef(null)
  const fileInputRef = useRef(null)

  const formatText = (command, value = null) => {
    // Focus the editor first to ensure commands work
    const editor = document.querySelector(".editor-content")
    if (editor) {
      editor.focus()
    }

    // Execute the command
    const success = document.execCommand(command, false, value)

    updateActiveFormats()

    // Trigger input event to save changes
    if (editor) {
      const event = new Event("input", { bubbles: true })
      editor.dispatchEvent(event)
    }
  }

  const storeCurrentSelection = () => {
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      storedSelectionRef.current = {
        startContainer: range.startContainer,
        startOffset: range.startOffset,
        endContainer: range.endContainer,
        endOffset: range.endOffset,
        collapsed: range.collapsed,
        selectedText: selection.toString(),
      }
      return true
    }
    storedSelectionRef.current = null
    return false
  }

  const restoreSelection = () => {
    if (!storedSelectionRef.current) {
      return false
    }

    try {
      const selection = window.getSelection()
      const range = document.createRange()

      range.setStart(storedSelectionRef.current.startContainer, storedSelectionRef.current.startOffset)
      range.setEnd(storedSelectionRef.current.endContainer, storedSelectionRef.current.endOffset)

      selection.removeAllRanges()
      selection.addRange(range)

      return true
    } catch (error) {
      console.error("❌ Failed to restore selection:", error)
      return false
    }
  }

  const applyColorToSelection = (color, isHighlight = false) => {
    const editor = document.querySelector(".editor-content")
    if (!editor) {
      console.error("❌ Editor not found")
      return
    }

    // Focus editor first
    editor.focus()

    // Try to restore the stored selection
    const hasSelection = restoreSelection()

    if (!hasSelection) {
      return
    }

    const selection = window.getSelection()
    if (!selection.rangeCount) {
      return
    }

    const range = selection.getRangeAt(0)

    try {
      if (range.collapsed) {
        // No text selected - create a marker for future typing
        const marker = document.createElement("span")
        marker.className = "color-marker"

        if (isHighlight) {
          if (color === "transparent") {
            marker.style.backgroundColor = "transparent"
          } else {
            marker.style.backgroundColor = color
          }
        } else {
          marker.style.color = color
        }

        // Insert zero-width space to make the span selectable
        marker.textContent = "\u200B"
        range.insertNode(marker)

        // Position cursor after the marker
        range.setStartAfter(marker)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        // Text is selected - wrap it
        const contents = range.extractContents()
        const wrapper = document.createElement("span")

        if (isHighlight) {
          if (color === "transparent") {
            // Remove highlight by not setting background
            wrapper.style.backgroundColor = "transparent"
          } else {
            wrapper.style.backgroundColor = color
          }
        } else {
          wrapper.style.color = color
        }

        wrapper.appendChild(contents)
        range.insertNode(wrapper)

        // Clear selection
        selection.removeAllRanges()
      }

      // Clear stored selection
      storedSelectionRef.current = null

      // Trigger change event
      const event = new Event("input", { bubbles: true })
      editor.dispatchEvent(event)
    } catch (error) {
      console.error("❌ Error applying color:", error)
    }
  }

  const handleColorSelect = (color, type) => {
    if (type === "text") {
      setCurrentTextColor(color)
      applyColorToSelection(color, false)
      setShowTextColorPalette(false)
    } else if (type === "highlight") {
      setCurrentHighlightColor(color)
      applyColorToSelection(color, true)
      setShowHighlightPalette(false)
    }
  }

  const handleColorButtonClick = (type) => {
    // Store current selection before showing palette
    const hasSelection = storeCurrentSelection()

    if (type === "text") {
      setShowTextColorPalette(!showTextColorPalette)
      setShowHighlightPalette(false)
    } else {
      setShowHighlightPalette(!showHighlightPalette)
      setShowTextColorPalette(false)
    }
  }

  const clearFormatting = () => {
    const editor = document.querySelector(".editor-content")
    if (!editor) {
      console.error("❌ Editor not found")
      return
    }

    editor.focus()
    const selection = window.getSelection()

    if (!selection.rangeCount) {
      return
    }

    const range = selection.getRangeAt(0)

    try {
      if (range.collapsed) {
        // No text selected - clear formatting around cursor

        // Try execCommand first
        const success = document.execCommand("removeFormat", false, null)

        if (!success) {
          // Manual approach - find parent formatted elements
          const currentNode = range.startContainer
          let parentElement = currentNode.nodeType === Node.TEXT_NODE ? currentNode.parentElement : currentNode

          // Look for formatted parent elements to unwrap
          while (parentElement && parentElement !== editor) {
            if (
              parentElement.style.color ||
              parentElement.style.backgroundColor ||
              parentElement.tagName === "SPAN" ||
              parentElement.tagName === "STRONG" ||
              parentElement.tagName === "EM" ||
              parentElement.tagName === "U"
            ) {
              // Unwrap the element
              const parent = parentElement.parentNode
              while (parentElement.firstChild) {
                parent.insertBefore(parentElement.firstChild, parentElement)
              }
              parent.removeChild(parentElement)
              break
            }
            parentElement = parentElement.parentElement
          }
        }
      } else {
        // Text is selected
        const selectedText = selection.toString()

        if (selectedText.trim()) {
          // Method 1: Try execCommand first
          const success = document.execCommand("removeFormat", false, null)

          if (!success) {
            // Method 2: Manual replacement

            // Store the plain text
            const plainText = selectedText

            // Delete the selected content
            range.deleteContents()

            // Insert plain text node
            const textNode = document.createTextNode(plainText)
            range.insertNode(textNode)

            // Select the newly inserted text
            const newRange = document.createRange()
            newRange.selectNodeContents(textNode)
            selection.removeAllRanges()
            selection.addRange(newRange)
          }
        }
      }

      // Force update the editor
      const event = new Event("input", { bubbles: true })
      editor.dispatchEvent(event)

      // Update toolbar state
      setTimeout(() => {
        updateActiveFormats()
      }, 10)
    } catch (error) {
      console.error("❌ Error in clearFormatting:", error)

      // Last resort fallback
      try {
        document.execCommand("selectAll", false, null)
        document.execCommand("removeFormat", false, null)

        // Restore selection if we had one
        if (!range.collapsed) {
          const newRange = document.createRange()
          newRange.selectNodeContents(editor)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      } catch (fallbackError) {
        console.error("❌ Even fallback failed:", fallbackError)
      }
    }
  }

  const handleImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file (PNG, JPG, GIF, etc.)")
      return
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size should be less than 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageDataUrl = e.target.result
      insertImageIntoEditor(imageDataUrl, file.name)
    }

    reader.onerror = () => {
      console.error("❌ Error reading file")
      alert("Error reading the image file")
    }

    reader.readAsDataURL(file)

    // Clear the input so the same file can be selected again
    event.target.value = ""
  }

  const insertImageIntoEditor = (imageDataUrl, fileName) => {
    const editor = document.querySelector(".editor-content")
    if (!editor) {
      console.error("❌ Editor not found")
      return
    }

    editor.focus()

    try {
      // Create image element
      const img = document.createElement("img")
      img.src = imageDataUrl
      img.alt = fileName
      img.style.cssText = `
        max-width: 100%;
        height: auto;
        display: block;
        margin: 10px 0;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        cursor: pointer;
      `

      // Add click handler to allow resizing
      img.onclick = () => {
        const currentWidth = img.style.maxWidth || "100%"
        const sizes = ["25%", "50%", "75%", "100%"]
        const currentIndex = sizes.indexOf(currentWidth)
        const nextIndex = (currentIndex + 1) % sizes.length
        img.style.maxWidth = sizes[nextIndex]

        // Trigger change event
        const event = new Event("input", { bubbles: true })
        editor.dispatchEvent(event)
      }

      // Insert the image at cursor position
      const selection = window.getSelection()
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0)
        range.deleteContents()

        // Add some spacing
        const br1 = document.createElement("br")
        const br2 = document.createElement("br")

        range.insertNode(br2)
        range.insertNode(img)
        range.insertNode(br1)

        // Position cursor after the image
        range.setStartAfter(br2)
        range.collapse(true)
        selection.removeAllRanges()
        selection.addRange(range)
      } else {
        // No selection, append to end
        editor.appendChild(document.createElement("br"))
        editor.appendChild(img)
        editor.appendChild(document.createElement("br"))
      }

      // Trigger change event to save
      const event = new Event("input", { bubbles: true })
      editor.dispatchEvent(event)
    } catch (error) {
      console.error("❌ Error inserting image:", error)
      alert("Failed to insert image. Please try again.")
    }
  }

  const downloadPDF = async () => {
    const editor = document.querySelector(".editor-content")
    if (!editor) {
      console.error("❌ Editor not found")
      return
    }

    try {
      // Get the note title from the editor or use a default
      const noteTitle = document.querySelector(".title-input")?.value || "Note"

      // Create a temporary container for PDF content
      const pdfContainer = document.createElement("div")
      pdfContainer.style.cssText = `
        position: absolute;
        top: -9999px;
        left: -9999px;
        width: 800px;
        padding: 40px;
        background: white;
        color: black;
        font-family: Arial, sans-serif;
        font-size: 14px;
        line-height: 1.6;
      `

      // Add title
      const titleElement = document.createElement("h1")
      titleElement.textContent = noteTitle
      titleElement.style.cssText = `
        margin-bottom: 20px;
        font-size: 24px;
        color: #333;
        border-bottom: 2px solid #333;
        padding-bottom: 10px;
      `
      pdfContainer.appendChild(titleElement)

      // Add content
      const contentElement = document.createElement("div")
      contentElement.innerHTML = editor.innerHTML
      contentElement.style.cssText = `
        color: black;
        background: transparent;
      `

      // Clean up the content for PDF (remove any problematic styles)
      const spans = contentElement.querySelectorAll("span")
      spans.forEach((span) => {
        if (span.style.backgroundColor) {
          span.style.backgroundColor = "yellow" // Convert highlights to yellow for PDF
        }
      })

      // Ensure images are properly sized for PDF
      const images = contentElement.querySelectorAll("img")
      images.forEach((img) => {
        img.style.maxWidth = "100%"
        img.style.height = "auto"
        img.style.display = "block"
        img.style.margin = "10px 0"
      })

      pdfContainer.appendChild(contentElement)
      document.body.appendChild(pdfContainer)

      // Generate PDF using html2canvas and jsPDF
      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        allowTaint: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")

      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Clean up
      document.body.removeChild(pdfContainer)

      // Download the PDF
      const fileName = `${noteTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`
      pdf.save(fileName)
    } catch (error) {
      console.error("❌ Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    }
  }

  const updateActiveFormats = () => {
    const formats = new Set()
    try {
      if (document.queryCommandState("bold")) formats.add("bold")
      if (document.queryCommandState("italic")) formats.add("italic")
      if (document.queryCommandState("underline")) formats.add("underline")
      if (document.queryCommandState("insertUnorderedList")) formats.add("unordered")
      if (document.queryCommandState("insertOrderedList")) formats.add("ordered")
    } catch (error) {
      console.log("Error checking command state:", error)
    }
    setActiveFormats(formats)
  }

  // Update active formats when selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      updateActiveFormats()
    }

    document.addEventListener("selectionchange", handleSelectionChange)
    return () => document.removeEventListener("selectionchange", handleSelectionChange)
  }, [])

  // Close palettes when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".color-picker-container")) {
        setShowTextColorPalette(false)
        setShowHighlightPalette(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleFontSizeChange = (e) => {
    formatText("fontSize", e.target.value)
  }

  const handleAlignmentChange = (alignment) => {
    formatText(`justify${alignment}`)
  }

  const handleListClick = (listType) => {
    const editor = document.querySelector(".editor-content")
    if (!editor) {
      console.error("❌ Editor not found")
      return
    }

    editor.focus()

    try {
      // Use the correct execCommand for lists
      const command = listType === "bullet" ? "insertUnorderedList" : "insertOrderedList"

      // Execute the command
      const success = document.execCommand(command, false, null)

      if (!success) {
        // Fallback: Create list manually

        const selection = window.getSelection()
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0)
          const selectedText = selection.toString().trim()

          // Create list elements
          const listTag = listType === "bullet" ? "ul" : "ol"
          const list = document.createElement(listTag)
          const listItem = document.createElement("li")

          listItem.textContent = selectedText || "List item"
          list.appendChild(listItem)

          // Insert the list
          range.deleteContents()
          range.insertNode(list)

          // Position cursor in the list item
          const newRange = document.createRange()
          newRange.selectNodeContents(listItem)
          newRange.collapse(false)
          selection.removeAllRanges()
          selection.addRange(newRange)
        }
      }

      // Update toolbar state
      setTimeout(() => {
        updateActiveFormats()
      }, 100)

      // Trigger change event
      const event = new Event("input", { bubbles: true })
      editor.dispatchEvent(event)
    } catch (error) {
      console.error("❌ Error creating list:", error)
    }
  }

  // Fixed Grammar Check Handler
  const handleGrammarCheck = () => {
    const editor = document.querySelector(".editor-content")
    if (!editor) {
      console.error("❌ Editor not found")
      alert("Editor not found")
      return
    }

    const content = editor.innerHTML || editor.textContent || ""
    if (!content.trim()) {
      alert("No content to check for grammar")
      return
    }

    // Call the grammar check function passed from parent
    if (typeof onGrammarCheck === "function") {
      onGrammarCheck()
    } else {
      console.error("❌ onGrammarCheck is not a function:", typeof onGrammarCheck)
      alert("Grammar check function not available")
    }
  }

  return (
    <div className="toolbar">
      {/* Hidden file input for image upload */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />

      {/* Text Formatting */}
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${activeFormats.has("bold") ? "active" : ""}`}
          onClick={() => formatText("bold")}
          title="Bold (Ctrl+B)"
          aria-label="Bold"
        >
          <strong>B</strong>
        </button>
        <button
          className={`toolbar-btn ${activeFormats.has("italic") ? "active" : ""}`}
          onClick={() => formatText("italic")}
          title="Italic (Ctrl+I)"
          aria-label="Italic"
        >
          <em>I</em>
        </button>
        <button
          className={`toolbar-btn ${activeFormats.has("underline") ? "active" : ""}`}
          onClick={() => formatText("underline")}
          title="Underline (Ctrl+U)"
          aria-label="Underline"
        >
          <u>U</u>
        </button>
      </div>

      {/* Font Size */}
      <div className="toolbar-group">
        <select className="font-size-select" onChange={handleFontSizeChange} aria-label="Font size">
          <option value="1">10px</option>
          <option value="2">12px</option>
          <option value="3" defaultValue>
            14px
          </option>
          <option value="4">16px</option>
          <option value="5">18px</option>
          <option value="6">20px</option>
          <option value="7">24px</option>
        </select>
      </div>

      {/* Alignment */}
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={() => handleAlignmentChange("Left")}
          title="Align Left"
          aria-label="Align left"
        >
          ⬅️
        </button>
        <button
          className="toolbar-btn"
          onClick={() => handleAlignmentChange("Center")}
          title="Align Center"
          aria-label="Align center"
        >
          ↔️
        </button>
        <button
          className="toolbar-btn"
          onClick={() => handleAlignmentChange("Right")}
          title="Align Right"
          aria-label="Align right"
        >
          ➡️
        </button>
      </div>

      {/* Color Pickers */}
      <div className="toolbar-group">
        <div className="color-picker-container">
          <button
            className="toolbar-btn color-picker-btn"
            onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
            onClick={() => handleColorButtonClick("text")}
            title="Text Color"
            aria-label="Text color"
          >
            🎨 <span className="color-indicator" style={{ backgroundColor: currentTextColor }}></span>
          </button>
          <ColorPalette
            type="text"
            isOpen={showTextColorPalette}
            onColorSelect={(color) => handleColorSelect(color, "text")}
            onClose={() => setShowTextColorPalette(false)}
          />
        </div>

        <div className="color-picker-container">
          <button
            className="toolbar-btn color-picker-btn"
            onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
            onClick={() => handleColorButtonClick("highlight")}
            title="Highlight Color"
            aria-label="Highlight color"
          >
            🖍️ <span className="color-indicator" style={{ backgroundColor: currentHighlightColor }}></span>
          </button>
          <ColorPalette
            type="highlight"
            isOpen={showHighlightPalette}
            onColorSelect={(color) => handleColorSelect(color, "highlight")}
            onClose={() => setShowHighlightPalette(false)}
          />
        </div>

        <button
          className="toolbar-btn"
          onMouseDown={(e) => e.preventDefault()} // Prevent losing focus
          onClick={clearFormatting}
          title="Clear Formatting"
          aria-label="Clear formatting"
        >
          🧹 Clear
        </button>
      </div>

      {/* Lists */}
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${activeFormats.has("unordered") ? "active" : ""}`}
          onClick={() => handleListClick("bullet")}
          title="Bullet List"
          aria-label="Bullet list"
        >
          • List
        </button>
        <button
          className={`toolbar-btn ${activeFormats.has("ordered") ? "active" : ""}`}
          onClick={() => handleListClick("numbered")}
          title="Numbered List"
          aria-label="Numbered list"
        >
          1. List
        </button>
      </div>

      {/* Media */}
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={handleImageUpload} title="Insert Image" aria-label="Insert image">
          🖼️ Image
        </button>
      </div>

      {/* AI Features */}
      <div className="toolbar-group">
        <button
          className={`toolbar-btn ${isCheckingGrammar ? "loading" : ""}`}
          onClick={handleGrammarCheck}
          disabled={isCheckingGrammar}
          title="Check Grammar"
          aria-label="Check grammar"
        >
          {isCheckingGrammar ? "⏳" : "📝"} Grammar
        </button>
        {grammarErrors.length > 0 && (
          <span className="error-count" title={`${grammarErrors.length} issues found`}>
            {grammarErrors.length}
          </span>
        )}
      </div>

      {/* Export Features */}
      <div className="toolbar-group">
        <button className="toolbar-btn" onClick={downloadPDF} title="Download as PDF" aria-label="Download PDF">
          📄 PDF
        </button>
      </div>
    </div>
  )
}

export default Toolbar
