"""Transition model P(s',r|s,a) for GridWorld environment."""

from typing import NamedTuple
from beartype import beartype
import numpy as np
from environment.gridworld import GridWorld, Action, Position, CellType


class Transition(NamedTuple):
    """Single transition with next state and reward."""
    next_state: int
    reward: float


class TransitionModel:
    """Computes deterministic transitions (s',r) for GridWorld."""

    def __init__(self, gridworld: GridWorld):
        self.gridworld = gridworld
        self.size = gridworld.size

        # Cache for computed transitions
        self._transition_cache: dict[tuple[int, int], Transition] = {}

    @beartype
    def get_transition(self, state: int, action: int) -> Transition:
        """Get the deterministic transition from a state, given an action."""
        cache_key = (state, action)
        if cache_key in self._transition_cache:
            return self._transition_cache[cache_key]

        pos = self.gridworld.state_to_position(state)
        action_enum = Action(action)

        next_pos, reward = self._compute_transition_outcome(pos, action_enum)
        next_state = self.gridworld.position_to_state(next_pos)

        transition = Transition(next_state=next_state, reward=reward)

        self._transition_cache[cache_key] = transition
        return transition

    def _compute_transition_outcome(self, pos: Position, action: Action) -> tuple[Position, float]:
        """Compute the deterministic outcome of taking an action from a position."""
        # Get next position from standard move
        next_pos = self.gridworld._get_next_position(pos, action)

        # Calculate reward
        reward = self.gridworld.step_penalty

        # Check for wall collision
        if next_pos == pos:
            reward += self.gridworld.wall_penalty

        # Handle rewards and teleporting jump pads
        cell_type = self.gridworld.grid[next_pos.row, next_pos.col]
        if cell_type == CellType.GOAL:
            reward += self.gridworld.goal_reward
        elif cell_type == CellType.TRAP:
            reward += self.gridworld.trap_penalty
        elif cell_type == CellType.JUMP_PAD:
            current_pos_tuple = (next_pos.row, next_pos.col)
            if current_pos_tuple in self.gridworld.jump_destinations:
                dest_row, dest_col = self.gridworld.jump_destinations[current_pos_tuple]
                # The final position is the teleport destination
                next_pos = Position(dest_row, dest_col)

        return next_pos, reward

    @beartype
    def get_transition_matrix(self, action: int) -> tuple[np.ndarray, np.ndarray]:
        """Get full transition matrix P and reward matrix R for given action."""
        num_states = self.gridworld.get_state_space_size()
        P = np.zeros((num_states, num_states))
        R = np.zeros((num_states, num_states))

        for state in range(num_states):
            transition = self.get_transition(state, action)
            P[state, transition.next_state] = 1.0
            R[state, transition.next_state] = transition.reward

        return P, R

    @beartype
    def is_terminal_state(self, state: int) -> bool:
        """Check if state is terminal (goal or trap)."""
        pos = self.gridworld.state_to_position(state)
        cell_type = self.gridworld.grid[pos.row, pos.col]
        return cell_type in [CellType.GOAL, CellType.TRAP]

    @beartype
    def get_expected_reward(self, state: int, action: int) -> float:
        """Get immediate reward for state-action pair."""
        transition = self.get_transition(state, action)
        return transition.reward

    @beartype
    def clear_cache(self) -> None:
        """Clear transition cache (useful if environment changes)."""
        self._transition_cache.clear()
