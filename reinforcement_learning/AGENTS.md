# Part 1: Foundational RL Algorithms in GridWorld

## Environment: GridWorld with Jump & Stochasticity

### Core Components
- **Grid**: 10x10 with configurable obstacles, goal, traps, and special "jump" pads.
- **Actions**: `[UP, DOWN, LEFT, RIGHT]`
- **Jump Mechanic**: Landing on a jump pad allows the agent a special one-time action to move two spaces in a chosen cardinal direction.
- **Stochasticity**: 80% intended action, 20% random direction
- **Rewards**: Goal +10, Trap -10, Step -0.1, Wall collision -1

### Pygame Visualization Features
- **Real-time rendering**: Agent movement, grid states, obstacles
- **Value function heatmap**: Color-coded state values
- **Policy arrows**: Show optimal actions per state
- **Algorithm controls**: Play/pause, step-by-step, speed adjustment
- **Statistics panel**: Episode count, convergence metrics, current algorithm

## Algorithm Implementations

### 1. Dynamic Programming (Value Iteration)
**Core Logic:**
- Iteratively update the value function `V(s)` for all states using the Bellman optimality equation.
- This model-based approach requires a complete transition model `P(s', r | s, a)`.
- Continue sweeps until the value function converges (max change is below a small threshold).
- Extract the optimal policy from the final value function.

**Visualization:**
- Heatmap updates each iteration showing value convergence
- Policy arrows update when values change significantly
- Convergence graph showing max value change per iteration

### 2. Monte Carlo (First-Visit)
**Core Logic:**
- Estimate state values `V(s)` by running many full episodes and averaging the observed returns.
- For each episode, calculate the total discounted return `G` following the first visit to each state.
- This is a model-free approach that does not require knowledge of the environment dynamics.

**Visualization:**
- Episode trajectory animation
- Running average value updates
- Sample efficiency comparison with DP

### 3. Temporal Difference (Q-Learning)
**Core Logic:**
- Learn the optimal action-value function `Q(s, a)` in a model-free way.
- Update `Q(s, a)` after each step using the observed reward and the estimated value of the next state (bootstrapping).
- As an off-policy method, it learns the optimal policy even when executing actions from an exploratory policy (like ε-greedy).

**Visualization:**
- Q-value heatmaps for each action
- Exploration vs exploitation balance
- Learning curve showing episode rewards

## Project Structure
```
part1_gridworld/
├── environment/
│   ├── gridworld.py          # Core environment logic
│   └── transition_model.py   # P(s',r|s,a) calculations
├── algorithms/
│   ├── dynamic_programming.py
│   ├── monte_carlo.py
│   └── temporal_difference.py
├── visualization/
│   ├── pygame_renderer.py    # Main visualization engine
│   ├── heatmap.py           # Value function visualization
│   └── controls.py          # UI controls and statistics
├── utils/
│   ├── policy_utils.py      # Policy extraction and evaluation
│   └── metrics.py           # Convergence and performance metrics
└── main.py                  # Entry point with algorithm selection
```

## Key Learning Objectives
1. **Model-based vs Model-free**: Compare DP (requires full model) vs MC/TD
2. **Bootstrapping**: Understand TD's use of estimates vs MC's full returns
3. **Sample efficiency**: Observe convergence rates across algorithms
4. **Exploration strategies**: Implement and compare ε-greedy, softmax
5. **Hyperparameter sensitivity**: Visualize effects of α, γ, ε on learning

## Implementation Milestones
1. **Environment + Basic Visualization** (2-3 days)
2. **Dynamic Programming + Value Heatmaps** (2 days)
3. **Monte Carlo + Episode Visualization** (2 days)
4. **Q-Learning + Interactive Controls** (2-3 days)
5. **Comparative Analysis + Metrics Dashboard** (1-2 days)
