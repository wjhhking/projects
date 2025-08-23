import { Plus } from 'lucide-react'

const Sidebar = () => {
  const slides = [
    { id: '1', title: 'Product Introduction' },
    { id: '2', title: 'Product Features' },
    { id: '3', title: 'Market Outlook' },
  ]
  const currentSlideId = '2'

  return (
    <aside className="w-48 flex-shrink-0 bg-surface h-full flex flex-col border-r border-border">
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text-muted">INDEX</h2>
        <button className="h-9 w-9 flex items-center justify-center bg-primary-light text-primary rounded-lg hover:bg-blue-100 transition-colors">
          <Plus size={18} />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {slides.map((slide, index) => (
          <div key={slide.id} className="flex items-start gap-3">
            <span className="mt-1 text-sm font-semibold text-text-subtle">{index + 1}</span>
            <div className="flex-1">
              <div className={`aspect-[16/9] w-full rounded-md border-2 ${
                currentSlideId === slide.id ? 'border-primary' : 'border-border'
              } bg-background hover:border-primary/50 transition-colors`}>
                {/* Thumbnail Preview would go here */}
              </div>
              {currentSlideId === slide.id && (
                <div className="h-0.5 bg-primary mt-2 rounded-full" />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-border">
        <button className="w-full h-10 flex items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg text-text-muted hover:border-primary hover:text-primary transition-colors">
          <Plus size={16} />
          <span className="text-sm font-semibold">New Slide</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
