import Header from './components/UI/Header'
import Sidebar from './components/Slides/Sidebar'
import MainPreview from './components/Main/MainPreview'
import ChatPanel from './components/Chat/ChatPanel'

function App() {
  return (
    <div className="h-screen flex flex-col font-sans">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MainPreview />
        <ChatPanel />
      </div>
    </div>
  )
}

export default App