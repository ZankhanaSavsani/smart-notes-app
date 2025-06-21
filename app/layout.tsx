import type React from "react"
import type { Metadata, Viewport } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "NotesApp - Smart Note Taking",
  description: "A powerful note-taking app with AI features, encryption, and rich text editing",
  keywords: ["notes", "note-taking", "AI", "encryption", "productivity", "rich text editor"],
  authors: [{ name: "Zankhana" }],
  creator: "Zankhana",
  publisher: "Zankhana",
  robots: "index, follow",
  openGraph: {
    title: "NotesApp - Smart Note Taking",
    description: "A powerful note-taking app with AI features, encryption, and rich text editing",
    type: "website",
    locale: "en_US",
    siteName: "NotesApp",
  },
  twitter: {
    card: "summary_large_image",
    title: "NotesApp - Smart Note Taking",
    description: "A powerful note-taking app with AI features, encryption, and rich text editing",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
