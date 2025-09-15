"""Dynamic Programming (Value Iteration) algorithm implementation."""

from typing import Any
import numpy as np
from beartype import beartype

from .base_algorithm import BaseAlgorithm
from environment.gridworld import GridWorld, Action, Position, CellType
from environment.transition_model import TransitionModel


class DynamicProgramming(BaseAlgorithm):
    """Value Iteration implementation of Dynamic Programming."""

    @beartype
    def __init__(
        self,
        gridworld: GridWorld,
        gamma: float = 0.9,
        theta: float = 0.001,
        max_iterations: int = 100
    ):
        super().__init__(gridworld)
        self.gamma = gamma
        self.theta = theta
        self.max_iterations = max_iterations
        self.transition_model = TransitionModel(gridworld)

        # Initialize value function and policy
        self.values = np.zeros(gridworld.get_state_space_size())
        self.policy = np.zeros(gridworld.get_state_space_size(), dtype=int)
        self.q_values = np.zeros((gridworld.get_state_space_size(), gridworld.get_action_space_size()))

        # Training state
        self.iteration = 0
        self.converged = False
        self.training_complete = False

    @beartype
    def select_action(self, state: Position) -> Action:
        """Select action using the learned policy."""
        if not self.training_complete:
            # If not trained yet, run value iteration
            self.solve()

        state_idx = self.gridworld.position_to_state(state)
        action_idx = self.policy[state_idx]
        return Action(action_idx)

    @beartype
    def update(self, experience: dict[str, Any]) -> None:
        """DP doesn't learn from experience - it uses the model directly."""
        # Dynamic Programming is model-based and doesn't learn from experience
        # This method is required by the interface but not used
        pass

    @beartype
    def get_values(self) -> np.ndarray:
        """Get current state values."""
        return self.values.copy()

    @beartype
    def get_policy(self) -> np.ndarray:
        """Get current policy."""
        return self.policy.copy()

    @beartype
    def solve(self) -> dict[str, Any]:
        """Run value iteration to convergence."""
        if self.training_complete:
            return self._get_solution_info()

        print(f"🧮 Running Value Iteration (γ={self.gamma}, θ={self.theta})")

        for iteration in range(self.max_iterations):
            delta = self._value_iteration_step()
            self.iteration = iteration + 1

            if delta < self.theta:
                self.converged = True
                self.training_complete = True
                print(f"✅ Converged after {self.iteration} iterations (δ={delta:.6f})")
                break

            if iteration % 10 == 0:
                print(f"   Iteration {iteration + 1}: δ={delta:.6f}")

        if not self.converged:
            print(f"⚠️  Reached max iterations ({self.max_iterations}) without convergence")
            self.training_complete = True

        return self._get_solution_info()

    @beartype
    def _value_iteration_step(self) -> float:
        """Perform one step of value iteration."""
        new_values = np.zeros_like(self.values)
        new_policy = np.zeros_like(self.policy)

        for state in range(self.gridworld.get_state_space_size()):
            pos = self.gridworld.state_to_position(state)

            # Terminal states keep value 0
            if self.gridworld.grid[pos.row, pos.col] in [CellType.GOAL, CellType.TRAP]:
                new_values[state] = 0.0
                continue
            elif self.gridworld.grid[pos.row, pos.col] == CellType.OBSTACLE:
                new_values[state] = 0.0  # Unreachable
                continue

            # Bellman optimality equation: V*(s) = max_a Σ P(s',r|s,a)[r + γV*(s')]
            action_values = []
            for action in Action:
                transition = self.transition_model.get_transition(state, action.value)
                action_value = transition.reward + self.gamma * self.values[transition.next_state]
                action_values.append(action_value)
                self.q_values[state, action.value] = action_value

            new_values[state] = max(action_values)
            new_policy[state] = np.argmax(action_values)

        # Calculate maximum change
        delta = np.max(np.abs(new_values - self.values))

        self.values = new_values
        self.policy = new_policy

        return delta

    @beartype
    def _get_solution_info(self) -> dict[str, Any]:
        """Get information about the solution."""
        return {
            "algorithm": "Dynamic Programming (Value Iteration)",
            "converged": self.converged,
            "iterations": self.iteration,
            "gamma": self.gamma,
            "theta": self.theta,
            "max_value": float(np.max(self.values)),
            "min_value": float(np.min(self.values[self.values != 0])) if np.any(self.values != 0) else 0.0,
            "mean_value": float(np.mean(self.values[self.values != 0])) if np.any(self.values != 0) else 0.0
        }

    @beartype
    def get_q_values(self) -> np.ndarray:
        """Get Q-values for all state-action pairs."""
        return self.q_values.copy()

    @beartype
    def get_state_calculation(self, state: int) -> dict[str, Any]:
        """Get detailed Bellman calculation for a specific state."""
        pos = self.gridworld.state_to_position(state)

        if self.gridworld.grid[pos.row, pos.col] in [CellType.GOAL, CellType.TRAP]:
            entry_reward = self.gridworld.get_reward(pos.row, pos.col)
            return {
                "state": state,
                "position": pos,
                "is_terminal": True,
                "value": 0.0,
                "entry_reward": entry_reward,
                "cell_type": "GOAL" if self.gridworld.grid[pos.row, pos.col] == CellType.GOAL else "TRAP"
            }

        action_values = []
        for action in Action:
            transition = self.transition_model.get_transition(state, action.value)
            action_value = transition.reward + self.gamma * self.values[transition.next_state]
            next_pos = self.gridworld.state_to_position(transition.next_state)

            # Create transitions list (for deterministic case, just one transition)
            transitions = [{
                "next_state": transition.next_state,
                "next_pos": next_pos,
                "probability": 1.0,  # Deterministic for now
                "reward": transition.reward,
                "next_value": self.values[transition.next_state],
                "contribution": action_value
            }]

            action_values.append({
                "action": action,
                "value": action_value,
                "transitions": transitions
            })

        best_action_idx = np.argmax([av["value"] for av in action_values])
        new_value = action_values[best_action_idx]["value"]

        return {
            "state": state,
            "position": pos,
            "is_terminal": False,
            "current_value": self.values[state],
            "action_values": action_values,
            "best_action": Action(best_action_idx),
            "best_action_idx": best_action_idx,
            "best_value": new_value,
            "new_value": new_value
        }

    @beartype
    def reset(self) -> None:
        """Reset the algorithm to initial state."""
        self.values.fill(0)
        self.policy.fill(0)
        self.q_values.fill(0)
        self.iteration = 0
        self.converged = False
        self.training_complete = False

    @beartype
    def get_description(self) -> str:
        """Get algorithm description."""
        return (f"Dynamic Programming (Value Iteration) - Model-based algorithm that "
                f"iteratively applies the Bellman optimality equation until convergence. "
                f"γ={self.gamma}, θ={self.theta}")
