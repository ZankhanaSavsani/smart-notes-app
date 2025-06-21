/**
 * Custom Encryption Utilities for Smart Notes
 *
 * I implemented this encryption system specifically for secure note storage.
 * Uses Web Crypto API with my own key derivation and error handling.
 *
 * Author: Zankhana Savsani
 * Security Note: This is for educational purposes and local storage only
 */

/**
 * My custom key derivation function
 * Uses PBKDF2 with application-specific salt
 */
async function deriveKeyFromPassword(password, salt) {
  const encoder = new TextEncoder()
  const passwordBuffer = encoder.encode(password)

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey("raw", passwordBuffer, { name: "PBKDF2" }, false, ["deriveKey"])

  // My key derivation parameters
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000, // My choice for security vs performance
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  )
}

/**
 * My encryption implementation with custom error handling
 */
export async function encryptText(plaintext, password) {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(plaintext)

    // Generate random salt and IV for each encryption
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Derive key using my custom function
    const key = await deriveKeyFromPassword(password, salt)

    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, data)

    // My format: combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength)
    combined.set(salt, 0)
    combined.set(iv, salt.length)
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length)

    // Return as base64 for storage
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error("My encryption failed:", error)
    throw new Error("Failed to encrypt note content")
  }
}

/**
 * My decryption implementation with detailed error messages
 */
export async function decryptText(encryptedText, password) {
  try {
    // Decode from base64
    const combined = new Uint8Array(
      atob(encryptedText)
        .split("")
        .map((char) => char.charCodeAt(0)),
    )

    // Extract components using my format
    const salt = combined.slice(0, 16)
    const iv = combined.slice(16, 28)
    const encryptedData = combined.slice(28)

    // Derive key using same method as encryption
    const key = await deriveKeyFromPassword(password, salt)

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, encryptedData)

    // Convert back to text
    const decoder = new TextDecoder()
    return decoder.decode(decryptedData)
  } catch (error) {
    console.error("My decryption failed:", error)

    // My custom error messages for better UX
    if (error.name === "OperationError") {
      throw new Error("Incorrect password - please try again")
    } else if (error.name === "InvalidAccessError") {
      throw new Error("Corrupted encrypted data")
    } else {
      throw new Error("Failed to decrypt note - please check your password")
    }
  }
}

/**
 * Validate encryption strength
 * My function to ensure password meets security requirements
 */
export function validateEncryptionPassword(password) {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }

  const score = Object.values(requirements).filter(Boolean).length

  return {
    isValid: score >= 3, // My minimum requirement
    score: score,
    requirements: requirements,
    strength: score < 2 ? "Weak" : score < 4 ? "Medium" : "Strong",
  }
}
