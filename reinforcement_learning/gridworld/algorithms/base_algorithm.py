"""Base algorithm interface for reinforcement learning algorithms."""

from abc import ABC, abstractmethod
from typing import Any
from beartype import beartype
import numpy as np
from environment.gridworld import GridWorld, Action, Position


class BaseAlgorithm(ABC):
    """Base class for all RL algorithms."""

    def __init__(self, gridworld: GridWorld):
        self.gridworld = gridworld
        self.name = self.__class__.__name__

    @abstractmethod
    def select_action(self, state: Position) -> Action:
        """Select an action given the current state."""
        pass

    @abstractmethod
    def update(self, experience: dict[str, Any]) -> None:
        """Update the algorithm with new experience."""
        pass

    @abstractmethod
    def get_values(self) -> np.ndarray | None:
        """Get state values for visualization."""
        pass

    @abstractmethod
    def get_policy(self) -> np.ndarray | None:
        """Get policy for visualization."""
        pass

    @beartype
    def reset(self) -> None:
        """Reset algorithm state (optional override)."""
        pass

    @beartype
    def get_description(self) -> str:
        """Get algorithm description."""
        return f"{self.name} algorithm"
