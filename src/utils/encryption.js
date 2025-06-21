// Simple encryption utility using Web Crypto API
export async function encryptText(text, password) {
  console.log("=== ENCRYPTION DEBUG ===")
  console.log("Input text:", JSON.stringify(text))
  console.log("Input text length:", text?.length || 0)
  console.log("Input text type:", typeof text)
  console.log("Password provided:", !!password)

  if (!text || text.length === 0) {
    console.warn("Warning: Empty or null text provided for encryption")
    // Instead of throwing an error, let's encrypt a placeholder
    text = " " // Single space as minimum content
  }

  if (!password || password.length === 0) {
    throw new Error("No password provided for encryption")
  }

  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    console.log("Encoded data length:", data.length)

    // Create a key from the password
    const passwordKey = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, [
      "deriveBits",
      "deriveKey",
    ])

    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(16))
    console.log("Generated salt length:", salt.length)

    // Derive the encryption key
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    )

    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12))
    console.log("Generated IV length:", iv.length)

    // Encrypt the data
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, data)
    console.log("Encrypted data length:", encrypted.byteLength)

    // Combine salt, iv, and encrypted data
    const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
    result.set(salt, 0)
    result.set(iv, salt.length)
    result.set(new Uint8Array(encrypted), salt.length + iv.length)

    console.log("Combined result length:", result.length)

    // Convert to base64 for storage
    const base64Result = arrayBufferToBase64(result)
    console.log("Base64 result length:", base64Result.length)
    console.log("Base64 result preview:", base64Result.substring(0, 50) + "...")
    console.log("FINAL ENCRYPTION RESULT:", JSON.stringify(base64Result))

    // Verify the result is valid base64
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Result)) {
      console.error("WARNING: Generated result is not valid base64!")
      throw new Error("Generated encryption result is not valid base64")
    } else {
      console.log("✓ Generated result is valid base64")
    }

    return base64Result
  } catch (error) {
    console.error("Encryption error:", error)
    console.error("ERROR DETAILS:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    })
    // CRITICAL FIX: Don't return original text on error - throw the error instead
    throw new Error(`Failed to encrypt text: ${error.message}`)
  }
}

export async function decryptText(encryptedText, password) {
  console.log("=== DECRYPTION DEBUG ===")
  console.log("Input encrypted text:", JSON.stringify(encryptedText))
  console.log("Input encrypted text length:", encryptedText?.length || 0)
  console.log("Input encrypted text type:", typeof encryptedText)
  console.log("Password provided:", !!password)

  // Check if the input looks like original text instead of encrypted data
  if (encryptedText && !encryptedText.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
    console.error("ERROR: Input appears to be original text, not encrypted data!")
    console.error("Input content preview:", encryptedText.substring(0, 100))
    console.error("This suggests encryption failed and original text was stored instead")
    throw new Error("Input is not encrypted data - appears to be original text")
  }

  if (!encryptedText || encryptedText.length === 0) {
    throw new Error("No encrypted data provided")
  }

  if (!password || password.length === 0) {
    throw new Error("No password provided for decryption")
  }

  try {
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    // Convert from base64
    console.log("Converting from base64...")
    const data = base64ToArrayBuffer(encryptedText)
    console.log("Converted data length:", data.byteLength)

    if (data.byteLength < 28) {
      // 16 (salt) + 12 (iv) minimum
      console.error("Data too small breakdown:")
      console.error("- Actual size:", data.byteLength, "bytes")
      console.error("- Required minimum: 28 bytes")
      console.error("- Salt needed: 16 bytes")
      console.error("- IV needed: 12 bytes")
      console.error("- This leaves:", data.byteLength - 28, "bytes for encrypted content")
      throw new Error(`Encrypted data is too small: ${data.byteLength} bytes (minimum 28)`)
    }

    // Extract salt, iv, and encrypted data
    const salt = data.slice(0, 16)
    const iv = data.slice(16, 28)
    const encrypted = data.slice(28)

    console.log("Extracted components:", {
      saltLength: salt.byteLength,
      ivLength: iv.byteLength,
      encryptedLength: encrypted.byteLength,
    })

    // Create a key from the password
    const passwordKey = await crypto.subtle.importKey("raw", encoder.encode(password), { name: "PBKDF2" }, false, [
      "deriveBits",
      "deriveKey",
    ])

    // Derive the decryption key
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      passwordKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    )

    // Decrypt the data
    console.log("Attempting decryption...")
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, encrypted)
    console.log("Decryption successful, length:", decrypted.byteLength)

    const result = decoder.decode(decrypted)
    console.log("Decoded result:", JSON.stringify(result))
    console.log("Decoded result length:", result.length)

    return result
  } catch (error) {
    console.error("Decryption error:", error)
    return null
  }
}

// Helper functions for base64 conversion
function arrayBufferToBase64(buffer) {
  try {
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const result = btoa(binary)
    console.log("arrayBufferToBase64:", { inputLength: bytes.byteLength, outputLength: result.length })
    return result
  } catch (error) {
    console.error("arrayBufferToBase64 error:", error)
    throw error
  }
}

function base64ToArrayBuffer(base64) {
  try {
    console.log("base64ToArrayBuffer input:", JSON.stringify(base64))
    console.log("base64ToArrayBuffer input length:", base64.length)

    // Check if it's valid base64
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64)) {
      console.error("Invalid base64 characters detected")
      console.error("Input contains invalid characters for base64")
      throw new Error("Invalid base64 format")
    }

    const binary = atob(base64)
    console.log("Decoded binary length:", binary.length)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    console.log("Final buffer length:", bytes.buffer.byteLength)
    return bytes.buffer
  } catch (error) {
    console.error("Base64 decode error:", error)
    console.error("Input was:", JSON.stringify(base64))
    throw new Error("Invalid base64 data")
  }
}

// Test function to verify encryption/decryption works
export async function testEncryption() {
  try {
    console.log("=== Testing Encryption ===")
    const testText = "Hello, this is a test message!"
    const testPassword = "testpassword123"

    console.log("Original text:", testText)

    const encrypted = await encryptText(testText, testPassword)
    console.log("Encrypted successfully, length:", encrypted.length)

    const decrypted = await decryptText(encrypted, testPassword)
    console.log("Decrypted successfully:", decrypted)

    const success = decrypted === testText
    console.log("Test result:", success ? "PASS" : "FAIL")

    return success
  } catch (error) {
    console.error("Test failed:", error)
    return false
  }
}

// Generate a secure random password
export function generatePassword(length = 12) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  return Array.from(array, (byte) => charset[byte % charset.length]).join("")
}
