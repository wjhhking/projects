"""Random strategy algorithm for baseline comparison."""

import random
from typing import Any
from beartype import beartype
import numpy as np
from environment.gridworld import GridWorld, Action, Position
from .base_algorithm import BaseAlgorithm


class RandomStrategy(BaseAlgorithm):
    """Random action selection strategy."""

    def __init__(self, gridworld: GridWorld, seed: int | None = None):
        super().__init__(gridworld)
        self.seed = seed
        if seed is not None:
            random.seed(seed)
            np.random.seed(seed)

    @beartype
    def select_action(self, state: Position) -> Action:
        """Select a random valid action."""
        valid_actions = self.gridworld.get_valid_actions(state)
        if not valid_actions:
            return Action.UP  # Fallback if no valid actions
        return random.choice(valid_actions)

    @beartype
    def update(self, experience: dict[str, Any]) -> None:
        """Random strategy doesn't learn from experience."""
        pass

    @beartype
    def get_values(self) -> np.ndarray | None:
        """Random strategy has no learned values."""
        return None

    @beartype
    def get_policy(self) -> np.ndarray | None:
        """Random strategy has no fixed policy."""
        return None

    @beartype
    def get_description(self) -> str:
        """Get algorithm description."""
        return f"Random Strategy (seed: {self.seed})"
