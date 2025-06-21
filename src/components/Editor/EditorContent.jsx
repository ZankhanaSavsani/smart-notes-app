"use client"

import { useEffect, useRef } from "react"

function EditorContent({ content, onChange, grammarErrors, highlightGlossaryTerms }) {
  const editorRef = useRef(null)

  useEffect(() => {
    if (editorRef.current && content !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = content
    }
  }, [content])

  const handleInput = (e) => {
    onChange(e.target.innerHTML)
  }

  const handleKeyDown = (e) => {
    // Handle basic formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b":
          e.preventDefault()
          document.execCommand("bold")
          break
        case "i":
          e.preventDefault()
          document.execCommand("italic")
          break
        case "u":
          e.preventDefault()
          document.execCommand("underline")
          break
      }
    }
  }

  return (
    <div
      ref={editorRef}
      className="editor-content"
      contentEditable
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      suppressContentEditableWarning={true}
      style={{
        minHeight: "400px",
        maxHeight: "none",
        overflow: "visible",
      }}
      placeholder="Start writing your note..."
    />
  )
}

export default EditorContent
