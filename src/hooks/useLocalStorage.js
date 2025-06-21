"use client"

import { useState, useEffect } from "react"

/**
 * Custom Hook for localStorage Management
 *
 * Provides a React state-like interface for localStorage with automatic
 * synchronization and SSR safety. This hook handles JSON serialization,
 * error handling, and browser compatibility.
 *
 * @param {string} key - The localStorage key
 * @param {any} initialValue - Default value if key doesn't exist
 * @returns {[any, function]} - [value, setValue] tuple like useState
 */
export function useLocalStorage(key, initialValue) {
  // State to store the current value
  const [storedValue, setStoredValue] = useState(() => {
    // Return initial value during SSR (server-side rendering)
    if (typeof window === "undefined") {
      return initialValue
    }

    try {
      // Try to get value from localStorage
      const item = window.localStorage.getItem(key)
      // Parse stored JSON or return initial value if null
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      // If error (corrupted data, etc.), return initial value
      console.warn(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Function to update both state and localStorage
  const setValue = (value) => {
    try {
      // Allow value to be a function for functional updates
      const valueToStore = value instanceof Function ? value(storedValue) : value

      // Update React state
      setStoredValue(valueToStore)

      // Update localStorage (only in browser environment)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(key, JSON.stringify(valueToStore))
      }
    } catch (error) {
      // Log error but don't crash the app
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }

  // Sync with localStorage changes from other tabs/windows
  useEffect(() => {
    if (typeof window === "undefined") return

    const handleStorageChange = (e) => {
      // Only respond to changes for our specific key
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue))
        } catch (error) {
          console.warn(`Error parsing localStorage change for key "${key}":`, error)
        }
      }
    }

    // Listen for storage events (changes from other tabs)
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [key])

  return [storedValue, setValue]
}
