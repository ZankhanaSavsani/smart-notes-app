import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App.jsx"
import "./index.css"

function initApp() {
  const rootElement = document.getElementById("root")

  if (!rootElement) {
    console.error("Root element not found")
    return
  }

  const root = ReactDOM.createRoot(rootElement)
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp)
} else {
  initApp()
}
