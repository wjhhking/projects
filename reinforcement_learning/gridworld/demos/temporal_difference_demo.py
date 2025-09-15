"""Interactive TD(0) demonstration.

Run from gridworld directory:
uv run python -m demos.temporal_difference_demo
"""

import sys
import numpy as np
from beartype import beartype
import pygame

from environment.game1 import Game1
from visualization.pygame_renderer import PygameRenderer
from environment.gridworld import Action, Position, CellType
from algorithms.temporal_difference import TD0


class TD0Demo:
    """Interactive TD(0) demonstration."""

    def __init__(self):
        self.env = Game1()
        self.renderer = PygameRenderer(self.env)

        # Create TD(0) algorithm instance
        self.td0_algorithm = TD0(
            gridworld=self.env,
            gamma=0.9,
            alpha=0.1,
            epsilon=0.1
        )

        # Demo state
        self.show_value_text = True
        self.show_animation = False
        self.last_update_details = []

        print("🎯 TD(0) State Value Prediction Demo")
        print("=" * 40)
        print("Controls:")
        print("  SPACE: Run single episode")
        print("  1: Run 10 episodes")
        print("  2: Run 50 episodes")
        print("  3: Run 100 episodes")
        print("  T: Toggle value text display")
        print("  A: Toggle episode animation")
        print("  D: Debug state values around start")
        print("  U: Show value updates from last episode")
        print("  R: Reset algorithm")
        print("  ESC: Quit")
        print()

    @beartype
    def run_single_episode(self) -> dict:
        """Run a single TD(0) episode."""
        return self.td0_algorithm.run_episode()

    @beartype
    def run_batch_episodes(self, num_episodes: int) -> None:
        """Run multiple episodes in batch with progress updates."""
        print(f"\n🚀 Running {num_episodes} episodes in batch...")

        start_episode = self.td0_algorithm.current_episode
        successful_episodes = 0

        for i in range(num_episodes):
            metrics = self.td0_algorithm.run_episode()

            # Count successful episodes (reached goal or trap, not timeout)
            if metrics['length'] < 1000:
                successful_episodes += 1

            # Show progress every 10 episodes
            if (i + 1) % 10 == 0 or i == 0:
                print(f"  Episode {start_episode + i + 1}: "
                      f"Reward={metrics['reward']:+7.1f}, "
                      f"Length={metrics['length']:4d}, "
                      f"Avg={metrics['avg_reward']:+7.2f}")

        # Final batch summary
        final_metrics = {
            'episodes_run': num_episodes,
            'successful_episodes': successful_episodes,
            'success_rate': successful_episodes / num_episodes * 100,
            'total_episodes': self.td0_algorithm.current_episode,
            'states_learned': np.count_nonzero(self.td0_algorithm.state_values)
        }

        print(f"\n📊 Batch Complete!")
        print(f"  • Episodes run: {final_metrics['episodes_run']}")
        print(f"  • Success rate: {final_metrics['success_rate']:.1f}% ({successful_episodes}/{num_episodes})")
        print(f"  • Total episodes: {final_metrics['total_episodes']}")
        print(f"  • States learned: {final_metrics['states_learned']} state values")
        print()

    @beartype
    def print_episode_summary(self, metrics: dict) -> None:
        """Print detailed summary of the episode, including the full path."""
        episode = metrics['episode']
        reward = metrics['reward']
        length = metrics['length']
        avg_reward = metrics['avg_reward']
        states_visited = metrics['states_visited']
        value_updates = metrics.get('value_updates', 0)
        max_value_change = metrics.get('max_value_change', 0)
        update_details = metrics.get('update_details', [])

        print(f"Episode {episode:4d}: "
              f"Reward={reward:+7.1f}, "
              f"Length={length:4d}, "
              f"States={states_visited:2d}, "
              f"Avg={avg_reward:+7.2f}")

        print(f"             Value-updates={value_updates:2d}, "
              f"Max-V-change={max_value_change:.4f}")

        trajectory = self.td0_algorithm.last_episode_trajectory
        if trajectory:
            final_pos, _, final_reward = trajectory[-1]

            if length >= 1000:
                print(f"             ❌ TIMEOUT! Episode hit max steps at pos ({final_pos.row},{final_pos.col})")
                positions = [(pos.row, pos.col) for pos, _, _ in trajectory]
                unique_positions = len(set(positions))
                if unique_positions > 0:
                    print(f"             Unique positions: {unique_positions}/{length} "
                          f"(loop factor: {length/unique_positions:.1f}x)")
            elif final_reward == 10.0:
                print(f"             ✅ GOAL REACHED!")
            elif final_reward == -10.0:
                print(f"             💀 TRAP HIT!")

            full_path = " → ".join([f"({pos.row},{pos.col})" for pos, _, _ in trajectory])
            print(f"             Path: {full_path}")

        total_states = np.count_nonzero(self.td0_algorithm.state_values)
        print(f"             Total states learned: {total_states}")

        # Store update details for later display
        self.last_update_details = update_details

        # Show all value updates for first few episodes
        if episode <= 3 and update_details:
            print(f"             📊 All V-updates ({len(update_details)}):")
            for u in update_details:
                td_error = u['td_error']
                print(f"               ({u['state'].row},{u['state'].col}): "
                      f"{u['old_value']:.3f} → {u['new_value']:.3f} (Δ{td_error:+.3f}) "
                      f"[target={u['target']:.2f}]")

        # Show current policy for all visited states
        if episode % 10 == 0 or episode <= 3:
            self._print_all_policy()

        print()

    @beartype
    def _update_visualization(self) -> None:
        """Update renderer with current algorithm state."""
        self.renderer.set_values(self.td0_algorithm.get_values())
        self.renderer.set_policy(self.td0_algorithm.get_policy())

    @beartype
    def print_learning_progress(self) -> None:
        """Print current learning progress."""
        episode_data = self.td0_algorithm.get_episode_data()
        current_episode = episode_data['current_episode']

        if current_episode == 0:
            return

        # Show recent performance
        recent_rewards = episode_data['episode_rewards'][-20:]
        recent_lengths = episode_data['episode_lengths'][-20:]

        if recent_rewards:
            avg_reward = np.mean(recent_rewards)
            avg_length = np.mean(recent_lengths)

            print(f"\n📊 Learning Progress (Episode {current_episode}):")
            print(f"   Recent 20 episodes - Avg Reward: {avg_reward:+6.2f}, Avg Length: {avg_length:.1f}")

            # Show value function statistics
            values = self.td0_algorithm.get_values()
            non_zero_values = values[values != 0]
            if len(non_zero_values) > 0:
                print(f"   Value function - States learned: {len(non_zero_values)}, "
                      f"Range: [{np.min(non_zero_values):6.2f}, {np.max(non_zero_values):6.2f}]")

    @beartype
    def draw_value_text(self) -> None:
        """Draw state value numbers on each tile."""
        if not self.show_value_text:
            return

        for state in range(self.env.get_state_space_size()):
            pos = self.env.state_to_position(state)

            # Skip obstacles
            if self.env.grid[pos.row, pos.col] == CellType.OBSTACLE:
                continue

            # Get tile rectangle
            rect = self.renderer._get_cell_rect(pos.row, pos.col)

            # Get state value
            state_value = self.td0_algorithm.state_values[state]

            # Skip if value is zero (not learned yet)
            if abs(state_value) < 0.001:
                continue

            # Format value text
            value_text = f"{state_value:.1f}"

            # Color based on value (green for positive, red for negative)
            if state_value > 0:
                text_color = (0, 150, 0)  # Green
            elif state_value < 0:
                text_color = (150, 0, 0)  # Red
            else:
                text_color = (100, 100, 100)  # Gray

            # Render text
            text_surf, text_rect = self.renderer._render_text(
                self.renderer.font, value_text, text_color
            )

            # Center text in tile
            text_rect.center = rect.center
            self.renderer.screen.blit(text_surf, text_rect)

    @beartype
    def print_debug_info(self) -> None:
        """Print detailed state values for debugging."""
        print("\n🔍 DEBUG: State values around start position")
        print("=" * 50)

        # Show values for start position (0,0) and nearby states
        start_positions = [(0, 0), (0, 1), (1, 0), (1, 1)]

        for row, col in start_positions:
            pos = Position(row, col)
            state_idx = self.env.position_to_state(pos)

            print(f"\nState ({row},{col}) - State Index {state_idx}:")
            state_value = self.td0_algorithm.state_values[state_idx]
            print(f"  V({row},{col}) = {state_value:+8.3f}")

        print("=" * 50)

    @beartype
    def draw_status_info(self) -> None:
        """Draw status information."""
        episode_data = self.td0_algorithm.get_episode_data()
        current_episode = episode_data['current_episode']

        status = f"Episode {current_episode} - Press SPACE for next episode"

        # Render status
        text_surf, _ = self.renderer._render_text(self.renderer.font, status, (0, 0, 0))
        self.renderer.screen.blit(text_surf, (10, 10))

    @beartype
    def run(self) -> None:
        """Run the interactive demonstration."""
        clock = pygame.time.Clock()
        running = True
        needs_redraw = True

        # Initial setup
        self.renderer.set_values(self.td0_algorithm.get_values())
        self.renderer.set_policy(self.td0_algorithm.get_policy())

        print("🎯 TD(0) Learning Started!")
        print("Press SPACE to run episodes")

        while running:
            # Handle events
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        running = False
                    elif event.key == pygame.K_SPACE:
                        # Run single episode
                        metrics = self.run_single_episode()
                        self.print_episode_summary(metrics)

                        # Animate the episode if enabled
                        if self.show_animation:
                            trajectory = self.td0_algorithm.last_episode_trajectory
                            self.renderer.animate_episode(trajectory)

                        self._update_visualization()
                        needs_redraw = True

                        # Print progress every 50 episodes
                        if metrics['episode'] % 50 == 0:
                            self.print_learning_progress()

                    elif event.key == pygame.K_1:
                        self.run_batch_episodes(10)
                        self._update_visualization()
                        needs_redraw = True

                    elif event.key == pygame.K_2:
                        self.run_batch_episodes(50)
                        self._update_visualization()
                        needs_redraw = True

                    elif event.key == pygame.K_3:
                        self.run_batch_episodes(100)
                        self._update_visualization()
                        needs_redraw = True

                    elif event.key == pygame.K_t:
                        self.show_value_text = not self.show_value_text
                        print(f"Value text: {'ON' if self.show_value_text else 'OFF'}")
                        needs_redraw = True

                    elif event.key == pygame.K_a:
                        self.show_animation = not self.show_animation
                        print(f"Animation: {'ON' if self.show_animation else 'OFF'}")

                    elif event.key == pygame.K_r:
                        self.td0_algorithm.reset()
                        self._update_visualization()
                        needs_redraw = True
                        print("🔄 Algorithm reset")

                    elif event.key == pygame.K_d:
                        self.print_debug_info()

                    elif event.key == pygame.K_u:
                        if self.last_update_details:
                            print(f"\n📊 All V-updates from last episode ({len(self.last_update_details)}):")
                            for u in self.last_update_details:
                                td_error = u['td_error']
                                print(f"  ({u['state'].row},{u['state'].col}): "
                                      f"{u['old_value']:.3f} → {u['new_value']:.3f} (Δ{td_error:+.3f}) "
                                      f"[target={u['target']:.2f}]")
                        else:
                            print("No value updates available from last episode")

            # Only render if something changed
            if needs_redraw:
                self.renderer.render()

                if self.show_value_text:
                    self.draw_value_text()

                self.draw_status_info()
                pygame.display.flip()
                needs_redraw = False

            clock.tick(60)

        self.renderer.close()
        print("👋 Demo finished!")

    @beartype
    def _print_all_policy(self) -> None:
        """Print complete policy for all visited states."""
        policy_info = self.td0_algorithm.get_all_policy_info()

        if not policy_info:
            print(f"             🎯 Policy: No states visited yet")
            return

        print(f"             🎯 Complete Policy ({len(policy_info)} states):")
        for info in policy_info:
            pos = info['position']
            best_action = info['best_action']
            state_value = info['state_value']
            visits = info['visits']

            print(f"               ({pos.row},{pos.col}): {best_action.name} "
                  f"[V={state_value:.2f}, visits={visits}]")


def main():
    """Main function."""
    demo = TD0Demo()
    demo.run()


if __name__ == "__main__":
    main()
