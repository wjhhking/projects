# 🎮 GameBit - One Line to a Game

A Next.js-based retro game generator that creates complete 8-bit style games from a single sentence description!

## 🎯 Core Features

### Dual Game Engine Architecture
- 🧩 **Composition Engine**: Declarative game creation using meta-templates and JSON configuration
- 🎮 **Classic Engine**: Traditional OOP-based games (Mario, Contra, Raiden, Battle City, Hundred Floors)
- 📝 **One-Line Generation**: Describe your game idea and watch it come to life
- 🕹️ **8-bit Pixel Art**: Authentic retro visual style with custom sprite system
- 🏃 **Multiple Game Types**: Platformers, shooters, puzzle games, and more
- ⌨️ **Simple Controls**: Arrow keys + Space/Z/X for all games
- 🏆 **Progressive Levels**: Each game features multiple challenging stages
- 💾 **Save System**: Save and replay your custom creations

### Game Mechanics
- **Player Characters**: 8-bit pixel art with smooth animations
- **Physics Engine**: Gravity, collision detection, platform mechanics
- **Enemy AI**: Various enemy types with different behaviors
- **Collectibles**: Animated coins, power-ups, and scoring system
- **Level Progression**: Flag-based level completion and advancement

## 🚀 Quick Start

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start creating games!

## 🎮 Game Controls

| Key | Function |
|-----|----------|
| ←→ Arrow Keys / A/D | Move left/right |
| ↑ Arrow Key / Space / W | Jump |
| Z | Action A (Attack/Interact) |
| X | Action B (Special abilities) |
| R | Restart (when game over) |

## 🎯 How to Use

### Game Generation
1. **Describe your game** in English, for example:
   - "A brave soldier runs through enemy territory shooting aliens and avoiding deadly bullets"
   - "Fast spaceship flies through asteroid field shooting alien enemies"
   - "Ninja warrior runs across rooftops avoiding traps and collecting stars"

2. Click **"Generate Game"** to create your composition plan

3. Review the generated meta-templates and parameters

4. Click **"Generate & Play"** to start your custom game

### Featured Classic Games
- **Mario**: Classic platformer with Goomba enemies and coin collection
- **Contra**: Side-scrolling shooter with multiple weapons and enemy types
- **Raiden**: Vertical scrolling space shooter
- **Battle City**: Tank combat with destructible terrain
- **Hundred Floors**: Puzzle-platformer with vertical progression

## 🛠️ Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and enhanced development experience
- **Canvas API** - Game rendering and pixel-perfect graphics
- **Phaser 3** - Game engine for composition-based games
- **Custom Sprite System** - 8-bit style pixel art rendering
- **CSS3** - Modern responsive UI with pixelated game canvas

## 📁 Project Structure

```
gamebit/
├── app/                      # Next.js App Router
│   ├── globals.css          # Global styles and responsive design
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Home page with game generator
│   ├── create/              # Unified game creation flow
│   ├── play_game/           # Game playing interface
│   ├── my-games/            # Saved games management
│   └── public-games/        # Public games gallery
├── components/              # React components
│   ├── GameCanvas.tsx       # Traditional game canvas
│   ├── PhaserPreview.tsx    # Phaser-based game preview
│   └── CompositionPreview.tsx # Composition system preview
├── lib/                     # Game engines and logic
│   ├── composition/         # Composition-based game engine
│   │   ├── inventory.ts     # Meta-template definitions
│   │   ├── builder.ts       # Game plan builder
│   │   ├── types.ts         # Type definitions
│   │   └── validate.ts      # Plan validation
│   ├── games/              # Traditional game implementations
│   │   ├── base-game.ts    # Abstract base game class
│   │   ├── mario-game.ts   # Mario-style platformer
│   │   ├── contra-game.ts  # Side-scrolling shooter
│   │   ├── raiden-game.ts  # Vertical space shooter
│   │   ├── battle-city-game.ts # Tank combat game
│   │   └── hundred-floors-game.ts # Puzzle platformer
│   ├── sprites/            # Pixel art sprite system
│   ├── audio.ts           # Audio management
│   ├── game-engine.ts     # Core game engine base
│   └── player.ts          # Player character physics
└── package.json           # Project dependencies
```

## 🎨 Core Features

### Dual Engine Architecture

#### 1. Composition Engine (inventory.ts)
- **Declarative**: Build games using JSON configuration
- **Meta-Templates**: 46+ pre-defined game components
- **Categories**: World, movement, entities, objectives, rules, spawning, UI
- **Event System**: Template communication via emits/listens
- **Runtime**: Phaser 3-based execution

Example composition:
```json
{
  "templates": [
    { "id": "mt.grid.world", "params": { "width": 20, "height": 20 } },
    { "id": "mt.actor.snakeBody", "params": { "startLength": 3 } },
    { "id": "mt.spawn.foodUniform", "params": { "maxFood": 1 } }
  ]
}
```

#### 2. Traditional Engine (base-game.ts)
- **Object-Oriented**: Class-based game development
- **Direct Control**: Manual game loop, rendering, physics
- **Optimized**: Canvas-based rendering for performance
- **Specialized**: Custom logic for each game type

### Intelligent Content Generation
Dynamic game parameter adjustment based on input keywords:
- `fast/quick/speed` → Increased character movement speed (300px/s)
- `jump/fly/high` → Enhanced jump power (500px/s)
- `hard/difficult/challenge` → 1.5x enemy movement speed
- `coin/gold/treasure` → More collectibles in levels

### 8-bit Visual Style
- Pixel-perfect rendering (`image-rendering: pixelated`)
- Custom sprite system with pixel art support
- Classic Mario-style character and enemy animations
- Retro color palettes and brick texture effects

### Complete Game Mechanics
- **Physics Engine**: Gravity, collision detection, platform interactions
- **Character System**: Animation states, directional control, death/respawn
- **Enemy AI**: Various enemy types with unique behaviors
- **Level System**: Progressive difficulty, flag-based completion
- **Scoring System**: Coin collection, enemy defeat points

## 🚀 Deployment

### Build Production Version
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## 📋 Development Roadmap

### Completed ✅
- [x] Dual game engine architecture (Composition + Traditional)
- [x] Meta-template system with 46+ components
- [x] Classic games: Mario, Contra, Raiden, Battle City, Hundred Floors
- [x] Custom sprite rendering system
- [x] Sentence parsing and game parameter adjustment
- [x] Phaser 3 integration for composition games
- [x] Game save and management functionality
- [x] Responsive UI design

### In Progress 🚧
- [ ] Enhanced AI-powered sentence parsing
- [ ] More meta-template categories and components
- [ ] Advanced enemy AI patterns
- [ ] Level editor for composition games
- [ ] Multiplayer support

### Planned 🔮
- [ ] Audio system integration (Web Audio API)
- [ ] Boss battle templates
- [ ] Game sharing and export functionality
- [ ] Visual scripting interface
- [ ] Mobile touch controls
- [ ] Steam Workshop-style game sharing

## 🎮 Meta-Template Categories

The composition engine includes these template categories:

- **World**: Grid systems, physics, scrolling, screen wrapping
- **Movement**: Platformer controls, orthogonal stepping, impulse mechanics
- **Entities**: Snake bodies, Tetris pieces, paddles, enemy formations
- **Objectives**: Line clearing, goal flags, growth mechanics
- **Rules**: Scoring systems, level progression, collision handling
- **Spawning**: Food placement, enemy generation, item distribution
- **UI**: HUD elements, score displays, life counters
- **Projectiles**: Bullets, bouncing balls, laser systems

---

🎮 Start your 8-bit game creation journey today!