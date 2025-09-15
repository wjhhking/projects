"""Monte Carlo (First-Visit) algorithm implementation."""

from beartype import beartype
import numpy as np
from collections import defaultdict
import random
from typing import Any

from .base_algorithm import BaseAlgorithm
from environment.gridworld import GridWorld, Action, Position


class MonteCarlo(BaseAlgorithm):
    """Monte Carlo First-Visit On-Policy Control algorithm."""

    @beartype
    def __init__(
        self,
        gridworld: GridWorld,
        gamma: float = 1.0,
        epsilon: float = 0.1,
        num_episodes: int = 1000
    ):
        super().__init__(gridworld)
        self.gamma = gamma
        self.epsilon = epsilon
        self.num_episodes = num_episodes

        # Action-value function and returns
        self.q_values = np.zeros((
            gridworld.get_state_space_size(),
            len(Action)
        ))
        self.q_returns = defaultdict(list)

        # Episode tracking
        self.current_episode = 0
        self.episode_rewards = []
        self.episode_lengths = []
        self.training_complete = False

        # For visualization
        self.last_episode_trajectory = []
        self.convergence_data = []

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
    def update(self, experience: dict[str, Any]) -> None:
        """Update algorithm with experience (not used in MC - we learn from full episodes)."""
        pass

    @beartype
    def get_values(self) -> np.ndarray:
        """Get current state values (max Q-value for each state)."""
        return np.max(self.q_values, axis=1)

    @beartype
    def get_policy(self) -> np.ndarray:
        """Get current greedy policy from Q-values, breaking ties randomly."""
        policy = np.zeros(self.gridworld.get_state_space_size(), dtype=int)
        for state_idx in range(self.gridworld.get_state_space_size()):
            q_s = self.q_values[state_idx]
            max_q = np.max(q_s)
            best_actions = np.where(q_s == max_q)[0]
            policy[state_idx] = np.random.choice(best_actions)
        return policy

    @beartype
    def get_all_policy_info(self) -> list[dict]:
        """Get policy information for all visited states."""
        policy_info = []

        # Get all states that have been visited (have non-zero Q-values)
        for state_idx in range(self.gridworld.get_state_space_size()):
            q_values = self.q_values[state_idx]
            if np.any(q_values != 0):  # State has been visited
                pos = self.gridworld.state_to_position(state_idx)

                max_q = np.max(q_values)
                best_actions = np.where(q_values == max_q)[0]
                best_action_idx = np.random.choice(best_actions)
                best_action = Action(best_action_idx)
                state_value = max_q

                # Count total visits to this state
                visits = sum(len(self.q_returns.get((state_idx, i), [])) for i in range(len(Action)))

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
    def generate_episode(self, max_steps: int = 1000) -> list[tuple[Position, Action, float]]:
        """Generate a complete episode using current policy."""
        episode = []
        state = self.gridworld.reset()
        steps = 0

        while self.gridworld.status.value == 0 and steps < max_steps:  # RUNNING
            action = self.select_action(state)
            step_result = self.gridworld.step(action)
            episode.append((state, action, step_result.reward))
            state = step_result.next_state
            steps += 1

        return episode

    @beartype
    def update_q_values(self, episode: list[tuple[Position, Action, float]]) -> dict[str, Any]:
        """Update Q-value function using first-visit Monte Carlo."""
        G = 0
        returns = []
        for _, _, reward in reversed(episode):
            G = self.gamma * G + reward
            returns.insert(0, G)

        visited_state_actions = set()
        update_details = []

        for i, (state, action, _) in enumerate(episode):
            state_idx = self.gridworld.position_to_state(state)
            action_idx = action.value

            if (state_idx, action_idx) not in visited_state_actions:
                visited_state_actions.add((state_idx, action_idx))

                old_q_value = self.q_values[state_idx, action_idx]
                self.q_returns[(state_idx, action_idx)].append(returns[i])
                new_q_value = np.mean(self.q_returns[(state_idx, action_idx)])
                self.q_values[state_idx, action_idx] = new_q_value

                # Track update details
                update_details.append({
                    'state': state,
                    'action': action,
                    'old_q': old_q_value,
                    'new_q': new_q_value,
                    'return': returns[i],
                    'visit_count': len(self.q_returns[(state_idx, action_idx)])
                })

        return {
            'updates': update_details,
            'total_updates': len(update_details)
        }

    @beartype
    def run_episode(self) -> dict[str, Any]:
        """Run a single episode and return metrics."""
        episode = self.generate_episode()
        old_q_values = self.q_values.copy()

        # Track which state-action pairs we'll update
        state_actions_in_episode = set()
        for state, action, _ in episode:
            state_idx = self.gridworld.position_to_state(state)
            state_actions_in_episode.add((state_idx, action.value))

        update_info = self.update_q_values(episode)

        # Calculate episode metrics
        total_reward = sum(reward for _, _, reward in episode)
        episode_length = len(episode)
        unique_states = len(set(self.gridworld.position_to_state(state) for state, _, _ in episode))

        self.episode_rewards.append(total_reward)
        self.episode_lengths.append(episode_length)
        self.last_episode_trajectory = episode

        # Track convergence (max change in Q-values)
        max_change = np.max(np.abs(self.q_values - old_q_values))
        self.convergence_data.append(max_change)

        # Count Q-values updated this episode
        q_updates = 0
        for state_idx, action_idx in state_actions_in_episode:
            if (state_idx, action_idx) in self.q_returns:
                q_updates += 1

        self.current_episode += 1

        return {
            'episode': self.current_episode,
            'reward': total_reward,
            'length': episode_length,
            'states_visited': unique_states,
            'q_updates': q_updates,
            'max_q_change': max_change,
            'avg_reward': np.mean(self.episode_rewards[-100:]) if self.episode_rewards else 0,
            'trajectory': [(pos.row, pos.col) for pos, _, _ in episode],
            'update_details': update_info['updates']
        }

    @beartype
    def solve(self) -> dict[str, Any]:
        """Run complete Monte Carlo learning."""
        print(f"🎯 Running Monte Carlo with {self.num_episodes} episodes (γ={self.gamma}, ε={self.epsilon})")
        print("📚 Learning Q(s,a) values from complete episode returns...")
        print()

        for episode in range(self.num_episodes):
            metrics = self.run_episode()

            # Detailed logging for early episodes and every 50th episode
            if episode < 10 or episode % 50 == 0:
                print(f"📊 Episode {episode + 1}:")
                print(f"  • Reward: {metrics['reward']:.1f} | Length: {metrics['length']} steps")
                print(f"  • States visited: {metrics['states_visited']} | Q-updates: {metrics['q_updates']}")
                print(f"  • Max Q-change: {metrics['max_q_change']:.4f}")
                print(f"  • Path start: {metrics['trajectory']}")
                print(f"  • Avg reward (last 100): {metrics['avg_reward']:.2f}")

                # Show exploration vs exploitation
                total_sa_pairs = len(self.q_returns)
                print(f"  • Total (s,a) pairs learned: {total_sa_pairs}")
                print()

        self.training_complete = True

        # Final statistics
        total_sa_pairs = len(self.q_returns)
        states_with_values = np.count_nonzero(np.max(self.q_values, axis=1))

        print(f"🏁 Training Complete!")
        print(f"  • Episodes: {self.num_episodes}")
        print(f"  • Final avg reward: {np.mean(self.episode_rewards[-100:]):.2f}")
        print(f"  • States learned: {states_with_values}/{self.gridworld.get_state_space_size()}")
        print(f"  • Total (s,a) pairs: {total_sa_pairs}")

        return {
            'episodes_run': self.num_episodes,
            'final_avg_reward': np.mean(self.episode_rewards[-100:]) if self.episode_rewards else 0,
            'states_learned': states_with_values,
            'total_sa_pairs': total_sa_pairs,
            'convergence_data': self.convergence_data
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
    def reset(self) -> None:
        """Reset the algorithm to initial state."""
        self.q_values.fill(0)
        self.q_returns.clear()
        self.current_episode = 0
        self.episode_rewards.clear()
        self.episode_lengths.clear()
        self.training_complete = False
        self.last_episode_trajectory.clear()
        self.convergence_data.clear()

    @beartype
    def get_description(self) -> str:
        """Get algorithm description."""
        return (f"Monte Carlo (On-Policy) - Model-free algorithm that learns "
                f"from complete episodes by averaging returns. "
                f"γ={self.gamma}, ε={self.epsilon}, episodes={self.num_episodes}")
