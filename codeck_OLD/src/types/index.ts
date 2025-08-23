// 核心数据类型定义

export interface Deck {
  id: string
  title: string
  description?: string
  theme: string
  slides: SlideFile[]
  metadata: {
    createdAt: Date
    updatedAt: Date
    version: number
  }
}

// 每个幻灯片对应一个文件
export interface SlideFile {
  id: string
  filename: string // 如 "slide1.md", "slide2.md"
  order: number
  title?: string
  content: string // Markdown 内容
  layout: 'title' | 'content' | 'two-column' | 'image' | 'blank'
  background?: {
    type: 'color' | 'image' | 'gradient'
    value: string
  }
}

// 传统的 Slide 接口保留用于渲染
export interface Slide {
  id: string
  order: number
  title?: string
  elements: Element[]
  layout: 'title' | 'content' | 'two-column' | 'image' | 'blank'
  background?: {
    type: 'color' | 'image' | 'gradient'
    value: string
  }
}

export interface Element {
  id: string
  type: 'text' | 'image' | 'list' | 'code' | 'chart'
  position: { x: number; y: number; width: number; height: number }
  content: any // 根据 type 变化
  style: {
    fontSize?: number
    color?: string
    fontFamily?: string
    alignment?: 'left' | 'center' | 'right'
  }
}

export interface Patch {
  id: string
  deckId: string
  operations: Op[]
  description: string
  timestamp: Date
  applied: boolean
}

export interface Op {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test'
  path: string
  value?: any
  from?: string // for move/copy
}

// UI 相关类型
export interface AppState {
  currentDeck: Deck | null
  currentSlideId: string | null
  viewMode: 'slides' | 'code' // 幻灯片预览 或 代码编辑
  isDiffMode: boolean
  pendingPatch: Patch | null
  sidebarOpen: boolean
  theme: 'light' | 'dark'
}

// 编辑器相关
export interface EditorState {
  content: string
  language: string
  isProcessing: boolean
}

// 差异显示
export interface DiffView {
  added: Op[]
  removed: Op[]
  modified: Op[]
}

export interface HighlightedElement extends Element {
  changeType?: 'added' | 'removed' | 'modified'
  changes?: Op[]
}
