declare module 'reveal.js' {
  interface Api {
    initialize(): Promise<void>
    slide(h: number, v?: number): void
    on(type: string, listener: (event: any) => void): void
    destroy(): void
  }
  
  export default class Reveal {
    constructor(element: HTMLElement, config?: any)
    initialize(): Promise<void>
    slide(h: number, v?: number): void
    on(type: string, listener: (event: any) => void): void
    destroy(): void
  }
}

declare module 'reveal.js/plugin/markdown/markdown.esm.js' {
  const plugin: any
  export default plugin
}

declare module 'reveal.js/plugin/highlight/highlight.esm.js' {
  const plugin: any
  export default plugin
}

declare module 'reveal.js/plugin/notes/notes.esm.js' {
  const plugin: any
  export default plugin
}
