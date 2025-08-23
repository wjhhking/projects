import { CheckSquare, Presentation, Plus } from 'lucide-react'

const Header = () => {
  return (
    <header className="h-16 flex-shrink-0 bg-surface flex items-center justify-between px-6 border-b border-border">
      {/* Left: Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-text-main rounded-md flex items-center justify-center">
          <CheckSquare size={20} className="text-surface" />
        </div>
        <h1 className="text-lg font-bold text-text-main tracking-tight">Codeck</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <button className="h-9 px-4 flex items-center gap-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors shadow-subtle">
          <Presentation size={16} />
          <span>Present</span>
        </button>
        <button className="h-9 w-9 flex items-center justify-center bg-primary-light text-primary rounded-lg hover:bg-blue-100 transition-colors">
          <Plus size={18} />
        </button>
      </div>
    </header>
  )
}

export default Header
