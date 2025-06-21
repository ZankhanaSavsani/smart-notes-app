# Smart Notes App

A modern, feature-rich note-taking application built with React and Next.js. This app provides intelligent note management with AI-powered features, encryption capabilities, and a clean, responsive interface.

## 🚀 Features

### Core Functionality
- **Rich Text Editing**: Full-featured editor with formatting options
- **Smart Search**: Intelligent search across all notes and tags
- **Note Organization**: Pin important notes, add tags for categorization
- **Encryption**: Password-protect sensitive notes with AES encryption
- **Dark Mode**: Toggle between light and dark themes

### AI-Powered Features
- **Grammar Checking**: Real-time grammar and spelling error detection
- **Auto Glossary**: Automatic highlighting of technical terms with definitions
- **Content Insights**: Analysis of note content with reading time estimates
- **Smart Summaries**: AI-generated summaries for longer notes

### User Experience
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Keyboard Shortcuts**: Quick actions with Ctrl/Cmd shortcuts
- **Auto-save**: Automatic saving of changes as you type
- **Mobile-First**: Optimized mobile interface with collapsible sidebar

## 🛠️ Technology Stack

- **Frontend**: React 18, Next.js 13+ (App Router)
- **Styling**: CSS3 with custom properties, responsive design
- **State Management**: React Context API with useReducer
- **Storage**: Browser localStorage for data persistence
- **Encryption**: Web Crypto API for secure note encryption
- **AI Integration**: Groq API with intelligent fallbacks

## 📁 Project Structure

\`\`\`
src/
├── components/
│   ├── Editor/          # Rich text editor components
│   ├── Sidebar/         # Navigation and note list
│   ├── UI/             # Reusable UI components
│   └── Modals/         # Modal dialogs
├── contexts/
│   ├── NotesContext.jsx # Note management state
│   └── AIContext.jsx   # AI features and services
├── hooks/
│   └── useLocalStorage.js # Local storage hook
├── utils/
│   ├── encryption.js   # Note encryption utilities
│   └── textUtils.js    # Text processing helpers
└── App.jsx            # Main application component
\`\`\`

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation (This project is not currently linked to a Git repository)

1. **Clone the repository**
   \`\`\`bash
   git clone <repository-url>
   cd smart-notes-app
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables** (optional)
   \`\`\`bash
   # Create .env.local file
   GROQ_API_KEY=your_groq_api_key_here
   \`\`\`

4. **Start development server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🎯 Usage Guide

### Creating Notes
- Click the "+" button in the sidebar to create a new note
- Start typing in the editor - changes are saved automatically
- Add tags by typing in the tags input and pressing Enter

### Organizing Notes
- **Pin Notes**: Click the pin icon to keep important notes at the top
- **Search**: Use the search bar to find notes by title, content, or tags
- **Filter by Tags**: Click on tags in the sidebar to filter notes

### Security Features
- **Encrypt Notes**: Use the lock icon to password-protect sensitive notes
- **Decrypt Notes**: Click "Decrypt Note" and enter your password to view encrypted content

### Keyboard Shortcuts
- `Ctrl/Cmd + B`: Toggle sidebar
- `Ctrl/Cmd + D`: Toggle dark mode
- `Enter` or `,`: Add tags while typing in tag input

## 🔧 Configuration

### AI Features
The app includes AI-powered features with automatic fallbacks:
- Grammar checking works offline with pattern-based detection
- Glossary highlighting uses a built-in technical terms database
- All features work without API keys, with enhanced functionality when Groq API is available

### Customization
- **Themes**: Modify CSS custom properties in `src/index.css`
- **AI Glossary**: Add terms to the fallback glossary in `AIContext.jsx`
- **Encryption**: Encryption settings can be adjusted in `utils/encryption.js`

## 🔒 Security & Privacy

- **Local Storage**: All notes are stored locally in your browser
- **No Server**: No data is sent to external servers (except optional AI features)
- **Encryption**: Uses AES-256-GCM encryption for protected notes
- **Privacy First**: Your notes remain private and under your control

## 🤝 Contributing

This project was developed as a demonstration of modern React development practices. The codebase follows:

- **Clean Architecture**: Separation of concerns with contexts, components, and utilities
- **Modern React**: Hooks, functional components, and latest React patterns
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Performance**: Optimized rendering and efficient state management

## 📝 Development Notes

### State Management
The app uses React Context API with useReducer for predictable state updates. The NotesContext manages all note operations while AIContext handles AI features independently.

### Error Handling
Comprehensive error handling ensures the app remains functional even when features fail. AI features gracefully fall back to local implementations.

### Mobile Optimization
The responsive design prioritizes mobile experience with touch-friendly interfaces and optimized layouts for small screens.

## 🚀 Deployment

### Vercel (Recommended)
1. Push code to GitHub repository
2. Connect repository to Vercel
3. Deploy automatically with each push

### Other Platforms
The app can be deployed to any static hosting service:
- Netlify
- GitHub Pages
- Firebase Hosting

## 📄 License

This project is developed for educational and demonstration purposes. Feel free to use the code as a reference for your own projects.

## 👨‍💻 Author

**Zankhana Savsani**
- Created as a demonstration of modern React development
- Showcases AI integration, encryption, and responsive design
- Built with attention to user experience and code quality

---

*Smart Notes App - Intelligent note-taking for the modern developer*
