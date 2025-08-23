const MainPreview = () => {
  return (
    <main className="flex-1 flex flex-col p-8">
      <div className="flex-1 w-full bg-surface rounded-xl border border-border shadow-subtle flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-text-main">Product Features</h1>
          <ul className="mt-4 text-text-muted list-disc list-inside">
            <li>High Performance</li>
            <li>Easy to Use</li>
            <li>Great Value</li>
          </ul>
        </div>
      </div>
    </main>
  )
}

export default MainPreview
