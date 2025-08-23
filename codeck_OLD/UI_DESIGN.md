# Codeck UI Design Plan

## Overall Layout Design

The UI will be clean, modern, and spacious, inspired by the provided "BountyHub" visual style. It prioritizes a focused writing and previewing experience.

### Normal Edit Mode

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [✓] Codeck                                   [Save] [Present] [Sign In]     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌──────────┐   ┌───────────────────────────────────┐   ┌──────────────────┐ │
│ │          │   │                                   │   │                  │ │
│ │ Slide    │   │       Main Preview Area           │   │   AI Assistant   │ │
│ │ Thumbnails├─>│      (Current Slide Preview)      │<──┤                  │ │
│ │          │   │                                   │   │  [Chat History]  │ │
│ │ [Card 1] │   │                                   │   │                  │ │
│ │ [Card 2] │   │                                   │   │  [Input Box]     │ │
│ │   ...    │   │                                   │   │                  │ │
│ │   [+]    │   │                                   │   │                  │ │
│ │          │   │                                   │   │                  │ │
│ └──────────┘   └───────────────────────────────────┘   └──────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Diff View Mode (When changes are suggested)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [✓] Codeck                                   [Accept] [Reject] [Sign In]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│ ┌──────────┐   ┌──────────────────[ Slide | Code ]──┐   ┌──────────────────┐ │
│ │          │   │  Original Version (Before)        │   │                  │ │
│ │ Slide    │   ├───────────────────────────────────┤   │   AI Assistant   │ │
│ │ Thumbnails│   │  Modified Version (After)         │   │  "Reviewing your │ │
│ │ (Slide 1*)│   │  - deletions                      │   │   changes..."    │ │
│ │          │   │  + additions                      │   │                  │ │
│ │          │   │                                   │   │                  │ │
│ │          │   │                                   │   │                  │ │
│ │          │   │                                   │   │                  │ │
│ └──────────┘   └───────────────────────────────────┘   └──────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```