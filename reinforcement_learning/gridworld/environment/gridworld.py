"""Generic GridWorld environment engine."""

from enum import IntEnum
from typing import NamedTuple
from beartype import beartype
import numpy as np


class GameStatus(IntEnum):
    """Current status of the game."""
    RUNNING = 0
    DONE = 1


class Action(IntEnum):
    """Available actions in the GridWorld."""
    UP = 0
    DOWN = 1
    LEFT = 2
    RIGHT = 3


class CellType(IntEnum):
    """Types of cells in the grid."""
    EMPTY = 0
    OBSTACLE = 1
    GOAL = 2
    TRAP = 3
    JUMP_PAD = 4


class Position(NamedTuple):
    """2D position in the grid."""
    row: int
    col: int


class StepResult(NamedTuple):
    """Result of taking a step in the environment."""
    next_state: Position
    reward: float
    done: bool
    info: dict


class GridWorld:
    """Generic GridWorld environment engine."""

    def __init__(
        self,
        size: int = 10,
        step_penalty: float = -0.1,
        goal_reward: float = 10.0,
        trap_penalty: float = -10.0,
        wall_penalty: float = -1.0,
        grid_config: np.ndarray | None = None,
        jump_destinations: dict[tuple[int, int], tuple[int, int]] | None = None
    ):
        self.size = size
        self.step_penalty = step_penalty
        self.goal_reward = goal_reward
        self.trap_penalty = trap_penalty
        self.wall_penalty = wall_penalty

        # Initialize grid and agent state
        if grid_config is not None:
            self.grid = grid_config.copy()
        else:
            self.grid = np.zeros((size, size), dtype=int)

        self.agent_pos = Position(0, 0)
        self.has_jump = False
        self.episode_steps = 0
        self.total_reward = 0.0
        self.start_pos = Position(0, 0)
        self.status = GameStatus.RUNNING

        # Jump destinations mapping
        self.jump_destinations = jump_destinations or {}

        # Action mappings
        self.action_deltas = {
            Action.UP: (-1, 0),
            Action.DOWN: (1, 0),
            Action.LEFT: (0, -1),
            Action.RIGHT: (0, 1)
        }

    @beartype
    def set_grid_config(self, grid_config: np.ndarray, jump_destinations: dict[tuple[int, int], tuple[int, int]] | None = None) -> None:
        """Set grid configuration and jump destinations."""
        self.grid = grid_config.copy()
        self.jump_destinations = jump_destinations or {}

    def _is_valid_position(self, pos: Position) -> bool:
        """Check if position is within grid bounds."""
        return 0 <= pos.row < self.size and 0 <= pos.col < self.size

    def _is_walkable(self, pos: Position) -> bool:
        """Check if position is walkable (not an obstacle)."""
        if not self._is_valid_position(pos):
            return False
        return bool(self.grid[pos.row, pos.col] != CellType.OBSTACLE)

    @beartype
    def reset(self, start_pos: Position | None = None) -> Position:
        """Reset environment to initial state."""
        if start_pos is None:
            start_pos = Position(0, 0)

        self.agent_pos = start_pos
        self.has_jump = False
        self.episode_steps = 0
        self.total_reward = 0.0
        self.start_pos = start_pos
        self.status = GameStatus.RUNNING
        return self.agent_pos

    def _get_next_position(self, pos: Position, action: Action, is_jump: bool = False) -> Position:
        """Get next position given current position and action."""
        dr, dc = self.action_deltas[action]

        # Jump moves two spaces
        if is_jump:
            dr *= 2
            dc *= 2

        next_pos = Position(pos.row + dr, pos.col + dc)

        # If next position is invalid or blocked, stay in current position
        if not self._is_walkable(next_pos):
            return pos

        return next_pos

    @beartype
    def step(self, action: Action, use_jump: bool = False) -> StepResult:
        """Take a step in the environment."""
        if self.status == GameStatus.DONE:
            # Return current state without changes if episode is over
            return StepResult(self.agent_pos, 0.0, True, {})

        self.episode_steps += 1

        # Can only use jump if agent has it and chooses to use it
        is_jump_attempt = use_jump and self.has_jump

        # Calculate next position
        old_pos = self.agent_pos
        next_pos = self._get_next_position(old_pos, action, is_jump_attempt)

        # Update agent position
        self.agent_pos = next_pos
        move_successful = self.agent_pos != old_pos

        # Initialize reward and info
        reward = self.step_penalty
        info = {"collision": False, "jump_used": False, "teleported": False}

        # Penalize for wall collisions
        if not move_successful:
            reward += self.wall_penalty
            info["collision"] = True

        # Handle jump consumption
        if is_jump_attempt and move_successful:
            self.has_jump = False
            info["jump_used"] = True

        # Handle cell-specific rewards and effects
        cell_type = self.grid[self.agent_pos.row, self.agent_pos.col]

        if cell_type == CellType.GOAL:
            reward += self.goal_reward
            self.status = GameStatus.DONE
        elif cell_type == CellType.TRAP:
            reward += self.trap_penalty
            self.status = GameStatus.DONE
        elif cell_type == CellType.JUMP_PAD:
            # Check if this jump pad has a specific destination
            current_pos_tuple = (self.agent_pos.row, self.agent_pos.col)
            if current_pos_tuple in self.jump_destinations:
                dest_row, dest_col = self.jump_destinations[current_pos_tuple]
                dest_pos = Position(dest_row, dest_col)
                if self._is_walkable(dest_pos):
                    self.agent_pos = dest_pos
                    info["teleported"] = True
            else:
                # Regular jump pad - gives jump ability
                self.has_jump = True

        self.total_reward += reward

        info.update({
            "old_pos": old_pos,
            "cell_type": cell_type,
            "episode_steps": self.episode_steps
        })

        done = self.status == GameStatus.DONE
        return StepResult(self.agent_pos, reward, done, info)

    @beartype
    def is_terminal(self) -> bool:
        """Check if the episode has ended."""
        return self.status == GameStatus.DONE

    @beartype
    def get_state_space_size(self) -> int:
        """Get total number of states."""
        return self.size * self.size

    @beartype
    def get_action_space_size(self) -> int:
        """Get number of available actions."""
        return len(Action)

    @beartype
    def position_to_state(self, pos: Position) -> int:
        """Convert position to state index."""
        return pos.row * self.size + pos.col

    @beartype
    def state_to_position(self, state: int) -> Position:
        """Convert state index to position."""
        return Position(state // self.size, state % self.size)

    @beartype
    def get_valid_actions(self, pos: Position | None = None) -> list[Action]:
        """Get valid actions from a position."""
        if pos is None:
            pos = self.agent_pos

        valid_actions = []
        for action in Action:
            next_pos = self._get_next_position(pos, action)
            if self._is_walkable(next_pos):
                valid_actions.append(action)

        return valid_actions

    @beartype
    def render_text(self) -> str:
        """Render grid as text."""
        symbols = {
            CellType.EMPTY: ".",
            CellType.OBSTACLE: "#",
            CellType.GOAL: "G",
            CellType.TRAP: "T",
            CellType.JUMP_PAD: "J"
        }

        lines = []
        for row in range(self.size):
            line = ""
            for col in range(self.size):
                if Position(row, col) == self.agent_pos:
                    line += "A"
                else:
                    line += symbols[self.grid[row, col]]
            lines.append(line)

        status = f"Agent: {self.agent_pos}, Jump: {'✓' if self.has_jump else '✗'}, Steps: {self.episode_steps}"
        return "\n".join(lines) + f"\n{status}"
