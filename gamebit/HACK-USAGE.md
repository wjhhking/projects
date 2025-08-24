# 🎯 Development Hack: Skip LLM Generation

This hack allows you to skip LLM generation during development by reusing existing files.

## How It Works

When you click "Generate Game", the API will:

1. **Check for existing files** in `tmp/`:
   - `tmp/runtimeOps.json`
   - `tmp/tmpPhaserPreview.tsx`

2. **If both files exist**: Use them immediately (no LLM call) 🚀
3. **If files missing**: Generate normally via LLM 🤖

## Benefits

- ⚡ **Instant response** (~50ms instead of ~30s)
- 💰 **No API costs** during development
- 🔄 **Same results** as you iterate on the component

## Usage

### Normal Development (Fast Mode)
1. Generate a game once (creates the files)  
2. All subsequent generations use cached files
3. Game loads instantly! 

### Clear Cache (Start Fresh)
```bash
# Option 1: Use npm script
npm run clear-cache

# Option 2: Delete files manually
rm tmp/runtimeOps.json tmp/tmpPhaserPreview.tsx

# Option 3: Use the script directly
node clear-cache.js
```

### Force Regeneration (Future)
```javascript
// In API call, add forceGenerate: true
fetch('/api/compose', {
  method: 'POST',
  body: JSON.stringify({ 
    prompt: 'your prompt', 
    forceGenerate: true  // Bypasses cache
  })
})
```

## Console Output

You'll see different messages:
- `🚀 [HACK] Using existing tmp files` - Cache hit
- `🔄 [NORMAL] tmp files not found` - Cache miss, using LLM
- `🔄 [FORCE] Forced regeneration` - Bypass cache explicitly

## Files Structure

```
tmp/
├── runtimeOps.json          # Game configuration
├── tmpPhaserPreview.tsx     # Generated React component
└── .gitkeep                 # Keeps tmp/ in git
```

This hack is perfect for development and testing! 🛠️
