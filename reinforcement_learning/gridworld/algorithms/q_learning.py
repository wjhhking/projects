"""Temporal Difference (Q-Learning) algorithm implementation."""

from collections import defaultdict
import random
from typing import Any

from beartype import beartype
import numpy as np

from .base_algorithm import BaseAlgorithm
from environment.gridworld import GridWorld, Action, Position


class QLearning(BaseAlgorithm):
    """Q-Learning: Off-policy temporal difference control algorithm."""

    @beartype
    def __init__(
        self,
        gridworld: GridWorld,
        gamma: float = 0.9,
        alpha: float = 0.1,  # Learning rate
        epsilon: float = 0.1,
    ):
        super().__init__(gridworld)
        self.gamma = gamma
        self.alpha = alpha
        self.epsilon = epsilon

        # Action-value function
        self.q_values = np.zeros((
            gridworld.get_state_space_size(),
            len(Action)
        ))

        # Metrics
        self.episode_rewards = []
        self.episode_lengths = []
        self.training_complete = False
        self.current_episode = 0

        # For visualization
        self.last_episode_trajectory = []
        self.convergence_data = []
        self.last_update_details = []

    @beartype
    def select_action(self, state: Position) -> Action:
        """Select action using epsilon-greedy policy w.r.t. Q-values."""
        state_idx = self.gridworld.position_to_state(state)

        if random.random() < self.epsilon:
            valid_actions = self.gridworld.get_valid_actions(state)
            return random.choice(valid_actions)

        # Greedy action: find best action(s) and break ties randomly
        q_s = self.q_values[state_idx]
        max_q = np.max(q_s)
        best_actions = np.where(q_s == max_q)[0]

        action_idx = np.random.choice(best_actions)
        return Action(action_idx)

    @beartype
    def update(self, experience: dict[str, Any]) -> dict[str, Any]:
        """Update Q-value using the Q-learning rule."""
        state = experience['state']
        action = experience['action']
        reward = experience['reward']
        next_state = experience['next_state']
        done = experience['done']

        state_idx = self.gridworld.position_to_state(state)
        action_idx = action.value
        next_state_idx = self.gridworld.position_to_state(next_state)

        # Q-learning update
        old_q = self.q_values[state_idx, action_idx]
        if done:
            target = reward
        else:
            next_max_q = np.max(self.q_values[next_state_idx])
            target = reward + self.gamma * next_max_q

        new_q = old_q + self.alpha * (target - old_q)
        self.q_values[state_idx, action_idx] = new_q

        # Return update details
        return {
            'state': state,
            'action': action,
            'old_q': old_q,
            'new_q': new_q,
            'target': target,
            'td_error': target - old_q
        }

    @beartype
    def get_values(self) -> np.ndarray:
        """Get current state values (max Q-value for each state)."""
        return np.max(self.q_values, axis=1)

    @beartype
    def get_policy(self) -> np.ndarray:
        """Get current greedy policy from Q-values."""
        return np.argmax(self.q_values, axis=1)

    @beartype
    def run_episode(self, max_steps: int = 1000) -> dict[str, Any]:
        """Run a single episode and return metrics."""
        episode_trajectory = []
        update_details = []
        old_q_values = self.q_values.copy()

        state = self.gridworld.reset()
        total_reward = 0
        steps = 0

        while self.gridworld.status.value == 0 and steps < max_steps:  # RUNNING
            action = self.select_action(state)
            step_result = self.gridworld.step(action)

            # Create experience for update
            experience = {
                'state': state,
                'action': action,
                'reward': step_result.reward,
                'next_state': step_result.next_state,
                'done': self.gridworld.status.value != 0
            }

            # Update Q-values
            update_info = self.update(experience)
            update_details.append(update_info)

            # Track episode
            episode_trajectory.append((state, action, step_result.reward))
            total_reward += step_result.reward
            state = step_result.next_state
            steps += 1

        # Calculate metrics
        unique_states = len(set(self.gridworld.position_to_state(s) for s, _, _ in episode_trajectory))
        max_change = np.max(np.abs(self.q_values - old_q_values))

        self.episode_rewards.append(total_reward)
        self.episode_lengths.append(steps)
        self.last_episode_trajectory = episode_trajectory
        self.last_update_details = update_details
        self.convergence_data.append(max_change)
        self.current_episode += 1

        return {
            'episode': self.current_episode,
            'reward': total_reward,
            'length': steps,
            'states_visited': unique_states,
            'q_updates': len(update_details),
            'max_q_change': max_change,
            'avg_reward': np.mean(self.episode_rewards[-100:]) if self.episode_rewards else 0,
            'trajectory': [(pos.row, pos.col) for pos, _, _ in episode_trajectory],
            'update_details': update_details
        }

    @beartype
    def get_episode_data(self) -> dict[str, Any]:
        """Get episode statistics for visualization."""
        return {
            'episode_rewards': self.episode_rewards,
            'episode_lengths': self.episode_lengths,
            'convergence_data': self.convergence_data,
            'last_trajectory': self.last_episode_trajectory,
            'current_episode': self.current_episode
        }

    @beartype
    def get_all_policy_info(self) -> list[dict[str, Any]]:
        """Get complete policy information for all states with non-zero Q-values."""
        policy_info = []

        for state in range(self.gridworld.get_state_space_size()):
            q_values = self.q_values[state]

            # Only include states that have been updated (non-zero Q-values)
            if np.any(q_values != 0):
                pos = self.gridworld.state_to_position(state)
                best_action_idx = np.argmax(q_values)
                best_action = Action(best_action_idx)
                state_value = np.max(q_values)

                # Count how many times this state has been visited
                visits = sum(1 for details in self.last_update_details
                           if self.gridworld.position_to_state(details['state']) == state)

                policy_info.append({
                    'position': pos,
                    'best_action': best_action,
                    'state_value': state_value,
                    'q_values': q_values.copy(),
                    'visits': visits
                })

        # Sort by position for consistent display
        policy_info.sort(key=lambda x: (x['position'].row, x['position'].col))
        return policy_info

    @beartype
    def reset(self) -> None:
        """Reset the algorithm to initial state."""
        self.q_values.fill(0)
        self.episode_rewards.clear()
        self.episode_lengths.clear()
        self.training_complete = False
        self.current_episode = 0
        self.last_episode_trajectory.clear()
        self.convergence_data.clear()
        self.last_update_details.clear()

    @beartype
    def get_description(self) -> str:
        """Get algorithm description."""
        return (f"Q-Learning - Off-policy TD control. "
                f"γ={self.gamma}, α={self.alpha}, ε={self.epsilon}")
