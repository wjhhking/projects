# GridWorld RL Environment

Interactive GridWorld environment with jump mechanics for reinforcement learning experiments.

## Project Structure

This project is organized into separate scripts for different purposes:

```
gridworld/
├── environment/          # Core environment logic
│   ├── gridworld.py     # Base GridWorld class
│   ├── game1.py         # Specific game configuration
│   └── transition_model.py # State transition model
├── algorithms/          # RL algorithm implementations
│   ├── base_algorithm.py    # Abstract base class
│   ├── random_strategy.py   # Random baseline
│   ├── dynamic_programming.py # Value iteration implementation
│   └── monte_carlo.py       # Monte Carlo first-visit implementation
├── demos/              # Interactive demonstrations
│   ├── menu.py         # Demo selection menu
│   ├── play.py         # Human interactive play
│   ├── replay.py       # Replay saved experiences
│   ├── bellman_equation_demo.py # Bellman equation explorer
│   ├── dynamic_programming_demo.py # DP algorithm demo
│   └── monte_carlo_demo.py # Monte Carlo learning demo
├── visualization/       # Pygame rendering
│   └── pygame_renderer.py
├── utils/              # Experience recording & replay
│   ├── experience_recorder.py
│   └── replay_system.py
├── experiences/        # Saved episode data
│   └── sessions/       # Organized by algorithm/date
├── assets/             # Game assets (images, etc.)
├── generate_experiences.py # Generate algorithm experiences
└── run_demos.py       # Main entry point for demos
```

## Installation

```bash
cd gridworld
uv sync
```

## Usage

### Main Demo Menu
```bash
uv run python run_demos.py
```
Interactive menu with all available demonstrations:
1. Interactive Play Mode
2. Replay Recorded Episodes
3. Bellman Equation Explorer
4. Dynamic Programming Demo
5. Monte Carlo Demo

### Individual Demos
```bash
# Human interactive play
uv run python demos/play.py

# Replay system
uv run python demos/replay.py list
uv run python demos/replay.py <episode_id>

# Bellman equation exploration
uv run python demos/bellman_equation_demo.py

# Dynamic programming visualization
uv run python demos/dynamic_programming_demo.py

# Monte Carlo learning demonstration
uv run python demos/monte_carlo_demo.py
```

### Generate Experiences
```bash
# Generate 10 random strategy episodes (default)
uv run python generate_experiences.py

# Generate custom number of episodes
uv run python generate_experiences.py 20
```

## Environment Features

- **10x10 Grid** with strategic obstacle placement
- **Jump Mechanics** - jump pads either teleport you or grant a one-time 2-space move ability
- **Real-time Visualization** with pygame
- **Experience Recording** for algorithm analysis

## Controls (Play Mode)

- **Arrow Keys**: Move agent
- **Space**: Use jump (if available)
- **R**: Reset environment
- **V**: Toggle value function heatmap
- **P**: Toggle policy arrows
- **ESC**: Quit

## Grid Elements

- **A**: Agent (blue=normal, orange=has jump)
- **#**: Obstacles (black)
- **Goal**: Goal (+10 reward, green)
- **X**: Traps (-10 reward, red)
- **JUMP**: Jump pads (cyan, gives jump ability)

## Rewards

- Goal: +10
- Trap: -10
- Step: -0.1
- Wall collision: -1

## Experience System

### Experience Storage
- Episodes are saved as JSON files in `experiences/` directory
- Each episode contains: algorithm, seed, steps, rewards, metadata
- Experiences are replayable with visualization

### Experience Grouping
Currently experiences are stored individually. Future considerations:
- **Session Groups**: Group experiences by training session
- **Algorithm Groups**: Group by algorithm type (DP, MC, TD)
- **Experiment Groups**: Group by hyperparameter experiments

### Planned Algorithm Implementations

1. **Dynamic Programming (Value Iteration)**
   - Model-based approach using transition probabilities
   - Iterative value function updates
   - Optimal policy extraction

2. **Monte Carlo (First-Visit)**
   - Model-free learning from complete episodes
   - Sample-based value estimation
   - Episode return averaging

3. **Temporal Difference (Q-Learning)**
   - Model-free with bootstrapping
   - Off-policy learning
   - Action-value function learning

## Development Roadmap

- [x] Environment & Visualization
- [x] Random Strategy Baseline
- [x] Experience Recording & Replay
- [x] Dynamic Programming Implementation
- [x] Interactive Demo System
- [x] Bellman Equation Explorer
- [x] Monte Carlo Implementation
- [ ] Q-Learning Implementation
- [ ] Comparative Analysis Dashboard
- [ ] Hyperparameter Tuning Interface

## Implementation Guidelines for Future Agents

### Adding New RL Algorithms

1. **Algorithm** (`algorithms/new_algorithm.py`) - inherit from `BaseAlgorithm`
2. **Demo** (`demos/new_algorithm_demo.py`) - copy pattern from `monte_carlo_demo.py`
3. **Menu** - add option to `demos/menu.py`
4. **README** - update project structure and roadmap

### Demo Requirements
- **Manual control only** - SPACE (step), T (values), R (reset), ESC (quit)
- **No auto-run or animations** - they cause blinking
- **Update visualization only on user action**
- **Keep it simple** - follow DP/MC demo patterns

### Run Commands
```bash
cd gridworld
uv run python -m demos.your_demo
uv run python run_demos.py  # test menu integration
```

## Current Demo Features

### 1. Interactive Play Mode
- Manual exploration with keyboard controls
- Real-time visualization of agent movement
- Jump mechanics demonstration
- Value function and policy overlays

### 2. Bellman Equation Explorer
- Static value function analysis
- Interactive state selection
- Detailed Bellman equation breakdown
- Gamma parameter adjustment
- Educational focus on equation components

### 3. Dynamic Programming Demo
- Step-by-step value iteration
- Real-time convergence visualization
- State calculation inspection
- Policy evolution tracking
- Final optimal path display

### 4. Replay System
- Visualize recorded episodes
- Episode listing and selection
- Playback controls

### 5. Monte Carlo Demo
- Episode-by-episode learning visualization
- Real-time value function updates
- Trajectory display with episode paths
- Auto-run mode for continuous learning
- Convergence tracking and statistics
