# Codeck Project Rewrite Plan

## Project Overview

**Codeck** - A modern, visually-driven presentation tool that allows users to create and edit slides using natural language. The user interface will be rebuilt from the ground up to be clean, intuitive, and aesthetically pleasing, inspired by modern web applications like "BountyHub".

### Core Features
- Natural language slide editing
- Real-time, high-fidelity preview
- A beautiful, minimalist user interface
- A clear and intuitive diff-and-review system for AI-generated changes
- Version control and history management

## Goals & Success Criteria

### Primary Goals
1.  **Superior User Experience**: Deliver a polished, intuitive, and visually appealing interface that makes presentation creation a delight.
2.  **Efficient AI Collaboration**: Streamline the process of instructing the AI and reviewing its suggestions.
3.  **Robust Core Logic**: Ensure the underlying slide generation and patching mechanism is reliable and accurate.

### Success Criteria
-   **Phase 1 (Foundation)**: Core back-end logic for slide manipulation via AI is functional.
-   **Phase 2 (UI Implementation)**: A fully implemented, visually stunning UI based on the new design direction.
-   **Phase 3 (Integration & Polish)**: A seamless, end-to-end user experience from instruction to final presentation, with all features integrated and polished.

## Phased Milestones

### Phase 1: Foundation & Core Logic (2 weeks)
**Goal**: Build the core engine for NL-to-slide-patch conversion.
- [ ] Project scaffolding with Vite, React, TypeScript.
- [ ] Define core data models (`Deck`, `Slide`, `Patch`).
- [ ] Implement a basic AI compiler service to turn natural language into JSON patches.
- [ ] Implement patch application logic.
- [ ] Basic state management with Zustand.

### Phase 2: UI Implementation (3 weeks)
**Goal**: Implement the complete, redesigned user interface.
- [ ] Build the main application layout (`Header`, `FileNavigation`, `StatusBar`).
- [ ] Create the new slide thumbnail component.
- [ ] Design and build the main slide preview component.
- [ ] Rebuild the AI Assistant chat panel with the new aesthetic.
- [ ] Implement all buttons, inputs, and other UI elements according to the new design.

### Phase 3: Integration & Polish (2 weeks)
**Goal**: Integrate UI with the core logic and polish the final product.
- [ ] Integrate the diff view UI with the patch generation and application logic.
- [ ] Implement the "Accept/Reject" workflow.
- [ ] Add Undo/Redo functionality.
- [ ] Implement file import/export.
- [ ] Conduct thorough testing and bug fixing.

## Technology Stack

The technology stack remains robust and well-suited for this project.
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Editor**: Monaco Editor (for code view)
- **Slide Rendering**: Reveal.js
- **Diff Processing**: jsondiffpatch
- **AI Integration**: Direct client-side calls to LLM APIs

## Timeline & Deliverables

| Phase | Duration | Key Tasks | Deliverable |
|---|---|---|---|
| **P1: Foundation** | 2 Weeks | Data Models, AI Compiler, Patch Logic | Headless prototype |
| **P2: UI Dev** | 3 Weeks | Component Implementation, Layout, Styling | Visually complete application (static) |
| **P3: Integration**| 2 Weeks | Diff Logic, Feature Polish, Testing | Production-ready MVP |

---

*This revised plan prioritizes a high-quality user interface while building on a solid technical foundation. The total estimated development time is 7 weeks.*