import { Send, Sparkles } from 'lucide-react'

const ChatPanel = () => {
  return (
    <aside className="w-80 flex-shrink-0 bg-surface h-full flex flex-col border-l border-border">
      <div className="h-16 flex items-center px-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          <h2 className="text-sm font-semibold text-text-muted">AI ASSISTANT</h2>
        </div>
      </div>
      <div className="flex-1 p-4">
        {/* Chat messages would go here */}
      </div>
      <div className="p-4 border-t border-border">
        <div className="relative">
          <textarea
            placeholder="Describe your changes..."
            className="w-full resize-none border border-border rounded-lg bg-background pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            rows={3}
          />
          <button className="absolute top-1/2 -translate-y-1/2 right-3 h-8 w-8 flex items-center justify-center bg-primary text-white rounded-md hover:bg-primary-hover transition-colors">
            <Send size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default ChatPanel
