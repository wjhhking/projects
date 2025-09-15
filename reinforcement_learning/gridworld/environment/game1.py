"""Game 1: Classic GridWorld with jump pads and obstacles."""

import numpy as np
from beartype import beartype
from .gridworld import GridWorld, CellType, Position


class Game1(GridWorld):
    """Game 1: Classic GridWorld configuration with jump mechanics."""

    def __init__(
        self,
        size: int = 10,
        step_penalty: float = -0.1,
        goal_reward: float = 10.0,
        trap_penalty: float = -10.0,
        wall_penalty: float = -1.0
    ):
        # Create the specific grid configuration for Game 1
        grid_config = self._create_game1_grid(size)
        jump_destinations = self._create_game1_jump_destinations()

        super().__init__(
            size=size,
            step_penalty=step_penalty,
            goal_reward=goal_reward,
            trap_penalty=trap_penalty,
            wall_penalty=wall_penalty,
            grid_config=grid_config,
            jump_destinations=jump_destinations
        )

    @staticmethod
    @beartype
    def _create_game1_grid(size: int) -> np.ndarray:
        """Create the specific grid layout for Game 1."""
        grid = np.zeros((size, size), dtype=int)

        # Add obstacles - L-shaped formations
        obstacles = [(2, 3), (3, 2), (3, 3), (6, 6), (7, 6), (8, 6), (9, 6)]
        for r, c in obstacles:
            grid[r, c] = CellType.OBSTACLE

        # Add goal at bottom-right corner
        goals = [(8, 8)]
        for r, c in goals:
            grid[r, c] = CellType.GOAL

        # Add traps - scattered around the grid
        traps = [(4, 4), (1, 7), (7, 1)]
        for r, c in traps:
            grid[r, c] = CellType.TRAP

        # Add jump pads
        jump_pads = [(1, 4), (5, 2), (3, 7)]
        for r, c in jump_pads:
            grid[r, c] = CellType.JUMP_PAD

        return grid

    @staticmethod
    def _create_game1_jump_destinations() -> dict[tuple[int, int], tuple[int, int]]:
        """Create jump pad destinations for Game 1."""
        return {
            (1, 4): (0, 1),  # Jump pad at (1,4) teleports to (0,1)
            (5, 2): (6, 5),  # Jump pad at (5,2) teleports to (6,5)
            (3, 7): (4, 2)   # Jump pad at (3,7) teleports to (4,2)
        }

    @beartype
    def get_description(self) -> str:
        """Get description of this game configuration."""
        return """
Game 1: Classic GridWorld Adventure

Features:
- 10x10 grid with strategic obstacle placement
- Goal at bottom-right corner (8,8) worth +10 points
- 3 dangerous traps worth -10 points each
- 3 teleporting jump pads for quick navigation
- Wall collision penalty: -1 point
- Step penalty: -0.1 points

Objective: Navigate from start (0,0) to goal (8,8) while avoiding traps
and using jump pads strategically to maximize your score!
        """.strip()
