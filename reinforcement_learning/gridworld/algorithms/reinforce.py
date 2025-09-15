"""REINFORCE policy gradient algorithm implementation."""

import numpy as np
from typing import Any
from beartype import beartype
from environment.gridworld import GridWorld, Action, Position, CellType
from algorithms.base_algorithm import BaseAlgorithm


class PolicyNetwork:
    """Simple neural network for policy parameterization."""

    def __init__(self, state_size: int, action_size: int, learning_rate: float = 0.01):
        self.state_size = state_size
        self.action_size = action_size
        self.learning_rate = learning_rate

        # Initialize weights with small random values
        self.W = np.random.normal(0, 0.1, (state_size, action_size))
        self.b = np.zeros(action_size)

    @beartype
    def forward(self, state: int) -> np.ndarray:
        """Forward pass to get action probabilities."""
        # One-hot encode state
        state_vec = np.zeros(self.state_size)
        state_vec[state] = 1.0

        # Linear layer
        logits = np.dot(state_vec, self.W) + self.b

        # Clip logits to prevent overflow
        logits = np.clip(logits, -500, 500)

        # Softmax to get probabilities
        exp_logits = np.exp(logits - np.max(logits))  # Numerical stability
        probs = exp_logits / np.sum(exp_logits)

        # Ensure probabilities are valid and sum to 1
        probs = np.clip(probs, 1e-8, 1.0)  # Prevent zero probabilities
        probs = probs / np.sum(probs)  # Renormalize

        return probs

    @beartype
    def backward(self, state: int, action: int, advantage: float) -> None:
        """Backward pass to update weights using policy gradient."""
        # Clip advantage to prevent exploding gradients
        advantage = np.clip(advantage, -100, 100)

        # One-hot encode state
        state_vec = np.zeros(self.state_size)
        state_vec[state] = 1.0

        # Get current probabilities
        probs = self.forward(state)

        # Compute gradient (safe division)
        grad_log_prob = np.zeros(self.action_size)
        prob_action = max(probs[action], 1e-8)  # Prevent division by zero
        grad_log_prob[action] = 1.0 / prob_action

        # Policy gradient update
        grad_W = np.outer(state_vec, grad_log_prob) * advantage
        grad_b = grad_log_prob * advantage

        # Add entropy regularization to prevent policy collapse
        entropy_bonus = 0.01  # Small entropy coefficient
        entropy_grad = np.zeros(self.action_size)
        for a in range(self.action_size):
            entropy_grad[a] = -(np.log(probs[a]) + 1.0)

        grad_W += entropy_bonus * np.outer(state_vec, entropy_grad)
        grad_b += entropy_bonus * entropy_grad

        # Clip gradients to prevent exploding gradients
        grad_W = np.clip(grad_W, -10, 10)
        grad_b = np.clip(grad_b, -10, 10)

        # Update parameters
        self.W += self.learning_rate * grad_W
        self.b += self.learning_rate * grad_b

        # Clip weights to prevent them from becoming too large
        self.W = np.clip(self.W, -10, 10)
        self.b = np.clip(self.b, -10, 10)


class REINFORCE(BaseAlgorithm):
    """REINFORCE policy gradient algorithm."""

    def __init__(
        self,
        gridworld: GridWorld,
        learning_rate: float = 0.01,
        gamma: float = 0.99,
        baseline: bool = True
    ):
        super().__init__(gridworld)
        self.learning_rate = learning_rate
        self.gamma = gamma
        self.use_baseline = baseline

        # Initialize policy network
        state_size = gridworld.get_state_space_size()
        action_size = len(Action)
        self.policy_net = PolicyNetwork(state_size, action_size, learning_rate)

        # Episode storage
        self.episode_states: list[int] = []
        self.episode_actions: list[int] = []
        self.episode_rewards: list[float] = []

        # Statistics
        self.episode_count = 0
        self.total_reward_history: list[float] = []
        self.avg_reward = 0.0

        # Baseline for variance reduction
        self.baseline_value = 0.0

    @beartype
    def select_action(self, state: Position) -> Action:
        """Select action using current policy."""
        state_idx = self.gridworld.position_to_state(state)
        probs = self.policy_net.forward(state_idx)

        # Check for NaN or invalid probabilities
        if np.any(np.isnan(probs)) or np.any(probs < 0) or np.sum(probs) == 0:
            # Fallback to uniform random policy
            probs = np.ones(len(Action)) / len(Action)

        # Sample action from probability distribution
        action_idx = np.random.choice(len(Action), p=probs)
        return Action(action_idx)

    @beartype
    def update(self, experience: dict[str, Any]) -> None:
        """Store experience for episode-based update."""
        state_pos = experience['state']
        state_idx = self.gridworld.position_to_state(state_pos)
        action = experience['action']
        reward = experience['reward']

        self.episode_states.append(state_idx)
        self.episode_actions.append(action.value)
        self.episode_rewards.append(reward)

    @beartype
    def finish_episode(self) -> dict[str, Any]:
        """Complete episode and perform policy gradient update."""
        if not self.episode_states:
            return {"episode": self.episode_count, "reward": 0.0, "length": 0}

        # Calculate returns (discounted rewards)
        returns = self._calculate_returns()

        # Update baseline
        episode_return = sum(self.episode_rewards)
        if self.use_baseline:
            self.baseline_value = 0.9 * self.baseline_value + 0.1 * episode_return

        # Policy gradient updates
        for t in range(len(self.episode_states)):
            state = self.episode_states[t]
            action = self.episode_actions[t]

            # Use return as advantage (or return - baseline)
            advantage = returns[t]
            if self.use_baseline:
                advantage -= self.baseline_value

            # Update policy network
            self.policy_net.backward(state, action, advantage)

        # Update statistics
        self.episode_count += 1
        self.total_reward_history.append(episode_return)

        # Calculate running average
        if len(self.total_reward_history) > 100:
            self.total_reward_history.pop(0)
        self.avg_reward = np.mean(self.total_reward_history)

        # Prepare metrics
        metrics = {
            "episode": self.episode_count,
            "reward": episode_return,
            "length": len(self.episode_states),
            "avg_reward": self.avg_reward,
            "baseline": self.baseline_value
        }

        # Clear episode data
        self.episode_states.clear()
        self.episode_actions.clear()
        self.episode_rewards.clear()

        return metrics

    @beartype
    def _calculate_returns(self) -> list[float]:
        """Calculate discounted returns for each timestep."""
        returns = []
        G = 0.0

        # Calculate returns backwards
        for reward in reversed(self.episode_rewards):
            G = reward + self.gamma * G
            returns.insert(0, G)

        return returns

    @beartype
    def get_values(self) -> np.ndarray | None:
        """Get state values (not directly available in REINFORCE)."""
        # For visualization, we can show expected returns under current policy
        values = np.zeros(self.gridworld.get_state_space_size())

        for state in range(self.gridworld.get_state_space_size()):
            pos = self.gridworld.state_to_position(state)
            if self.gridworld.grid[pos.row, pos.col] != CellType.OBSTACLE:
                # Simple approximation: use baseline value
                values[state] = self.baseline_value

        return values

    @beartype
    def get_policy(self) -> np.ndarray | None:
        """Get policy for visualization."""
        policy = np.zeros(self.gridworld.get_state_space_size(), dtype=int)

        for state in range(self.gridworld.get_state_space_size()):
            pos = self.gridworld.state_to_position(state)
            if self.gridworld.grid[pos.row, pos.col] != CellType.OBSTACLE:
                probs = self.policy_net.forward(state)
                policy[state] = np.argmax(probs)

        return policy

    @beartype
    def get_action_probabilities(self, state: Position) -> np.ndarray:
        """Get action probabilities for given state."""
        state_idx = self.gridworld.position_to_state(state)
        probs = self.policy_net.forward(state_idx)

        # Check for NaN or invalid probabilities
        if np.any(np.isnan(probs)) or np.any(probs < 0) or np.sum(probs) == 0:
            # Return uniform probabilities as fallback
            probs = np.ones(len(Action)) / len(Action)

        return probs

    @beartype
    def reset(self) -> None:
        """Reset algorithm state."""
        # Reinitialize policy network
        state_size = self.gridworld.get_state_space_size()
        action_size = len(Action)
        self.policy_net = PolicyNetwork(state_size, action_size, self.learning_rate)

        # Clear episode data
        self.episode_states.clear()
        self.episode_actions.clear()
        self.episode_rewards.clear()

        # Reset statistics
        self.episode_count = 0
        self.total_reward_history.clear()
        self.avg_reward = 0.0
        self.baseline_value = 0.0

    @beartype
    def get_episode_data(self) -> dict[str, Any]:
        """Get episode statistics."""
        return {
            "current_episode": self.episode_count,
            "avg_reward": self.avg_reward,
            "last_reward": self.total_reward_history[-1] if self.total_reward_history else 0.0,
            "baseline": self.baseline_value
        }

    @beartype
    def run_episode(self, max_steps: int = 1000) -> dict[str, Any]:
        """Run a complete episode and update policy."""
        self.gridworld.reset()
        steps = 0

        while not self.gridworld.is_terminal() and steps < max_steps:
            current_state = self.gridworld.agent_pos
            action = self.select_action(current_state)

            # Take action
            step_result = self.gridworld.step(action)

            # Store experience
            experience = {
                'state': current_state,
                'action': action,
                'reward': step_result.reward,
                'next_state': step_result.next_state,
                'done': step_result.done
            }
            self.update(experience)
            steps += 1

        # Finish episode and update policy
        return self.finish_episode()

    @beartype
    def get_description(self) -> str:
        """Get algorithm description."""
        return (f"REINFORCE Policy Gradient (lr={self.learning_rate:.3f}, "
                f"γ={self.gamma:.2f}, baseline={self.use_baseline})")
