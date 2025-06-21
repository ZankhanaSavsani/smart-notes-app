import { useNotes } from "../../contexts/NotesContext"
import RichTextEditor from "./RichTextEditor"
import WelcomeScreen from "./WelcomeScreen"

function MainEditor({ darkMode }) {
  const { currentNote } = useNotes()

  return <div className="main-content">{currentNote ? <RichTextEditor note={currentNote} /> : <WelcomeScreen />}</div>
}

export default MainEditor
