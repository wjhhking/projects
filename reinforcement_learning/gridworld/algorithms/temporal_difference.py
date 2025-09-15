"""Temporal Difference (TD(0)) algorithm implementation for state value prediction."""

import random
from typing import Any
from beartype import beartype
import numpy as np

from .base_algorithm import BaseAlgorithm
from environment.gridworld import GridWorld, Action, Position


class TD0(BaseAlgorithm):
    """TD(0): On-policy temporal difference prediction algorithm."""

    @beartype
    def __init__(
        self,
        gridworld: GridWorld,
        gamma: float = 0.9,
        alpha: float = 0.1,
        epsilon: float = 0.1,
    ):
        super().__init__(gridworld)
        self.gamma = gamma
        self.alpha = alpha
        self.epsilon = epsilon

        # State value function
        self.state_values = np.zeros(gridworld.get_state_space_size())

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
        """Select action using epsilon-greedy policy w.r.t. state values."""
        if random.random() < self.epsilon:
            valid_actions = self.gridworld.get_valid_actions(state)
            return random.choice(valid_actions)

        # Greedy action: choose action that leads to highest value next state
        state_idx = self.gridworld.position_to_state(state)
        valid_actions = self.gridworld.get_valid_actions(state)

        best_value = float('-inf')
        best_actions = []

        for action in valid_actions:
            # Simulate taking this action to see next state
            next_state = self.gridworld._get_next_position(state, action)
            next_state_idx = self.gridworld.position_to_state(next_state)
            next_value = self.state_values[next_state_idx]

            if next_value > best_value:
                best_value = next_value
                best_actions = [action]
            elif next_value == best_value:
                best_actions.append(action)

        return random.choice(best_actions)

    @beartype
    def update(self, experience: dict[str, Any]) -> dict[str, Any]:
        """Update state value using TD(0) rule."""
        state = experience['state']
        reward = experience['reward']
        next_state = experience['next_state']
        done = experience['done']

        state_idx = self.gridworld.position_to_state(state)
        next_state_idx = self.gridworld.position_to_state(next_state)

        # TD(0) update
        old_value = self.state_values[state_idx]
        if done:
            target = reward
        else:
            target = reward + self.gamma * self.state_values[next_state_idx]

        td_error = target - old_value
        new_value = old_value + self.alpha * td_error
        self.state_values[state_idx] = new_value

        # Return update details
        return {
            'state': state,
            'old_value': old_value,
            'new_value': new_value,
            'target': target,
            'td_error': td_error
        }

    @beartype
    def get_values(self) -> np.ndarray:
        """Get current state values."""
        return self.state_values.copy()

    @beartype
    def get_policy(self) -> np.ndarray:
        """Get current greedy policy from state values."""
        policy = np.zeros(self.gridworld.get_state_space_size(), dtype=int)

        for state_idx in range(self.gridworld.get_state_space_size()):
            pos = self.gridworld.state_to_position(state_idx)
            valid_actions = self.gridworld.get_valid_actions(pos)

            best_value = float('-inf')
            best_action = valid_actions[0]  # Default

            for action in valid_actions:
                next_pos = self.gridworld._get_next_position(pos, action)
                next_state_idx = self.gridworld.position_to_state(next_pos)
                next_value = self.state_values[next_state_idx]

                if next_value > best_value:
                    best_value = next_value
                    best_action = action

            policy[state_idx] = best_action.value

        return policy

    @beartype
    def run_episode(self, max_steps: int = 1000) -> dict[str, Any]:
        """Run a single episode and return metrics."""
        episode_trajectory = []
        update_details = []
        old_values = self.state_values.copy()

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

            # Update state values
            update_info = self.update(experience)
            update_details.append(update_info)

            # Track episode
            episode_trajectory.append((state, action, step_result.reward))
            total_reward += step_result.reward
            state = step_result.next_state
            steps += 1

        # Calculate metrics
        unique_states = len(set(self.gridworld.position_to_state(s) for s, _, _ in episode_trajectory))
        max_change = np.max(np.abs(self.state_values - old_values))

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
            'value_updates': len(update_details),
            'max_value_change': max_change,
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
        """Get complete policy information for all states with non-zero values."""
        policy_info = []

        for state in range(self.gridworld.get_state_space_size()):
            state_value = self.state_values[state]

            # Only include states that have been updated (non-zero values)
            if abs(state_value) > 0.001:
                pos = self.gridworld.state_to_position(state)

                # Get best action for this state
                valid_actions = self.gridworld.get_valid_actions(pos)
                best_value = float('-inf')
                best_action = valid_actions[0]

                for action in valid_actions:
                    next_pos = self.gridworld._get_next_position(pos, action)
                    next_state_idx = self.gridworld.position_to_state(next_pos)
                    next_value = self.state_values[next_state_idx]

                    if next_value > best_value:
                        best_value = next_value
                        best_action = action

                # Count how many times this state has been visited
                visits = sum(1 for details in self.last_update_details
                           if self.gridworld.position_to_state(details['state']) == state)

                policy_info.append({
                    'position': pos,
                    'best_action': best_action,
                    'state_value': state_value,
                    'visits': visits
                })

        # Sort by position for consistent display
        policy_info.sort(key=lambda x: (x['position'].row, x['position'].col))
        return policy_info

    @beartype
    def reset(self) -> None:
        """Reset the algorithm to initial state."""
        self.state_values.fill(0)
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
        return (f"TD(0) - On-policy state value prediction. "
                f"γ={self.gamma}, α={self.alpha}, ε={self.epsilon}")
