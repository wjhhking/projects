"""Interactive REINFORCE demonstration.

Run from gridworld directory:
uv run python -m demos.reinforce_demo
"""

import sys
import numpy as np
from beartype import beartype
import pygame

from environment.game1 import Game1
from visualization.pygame_renderer import PygameRenderer
from environment.gridworld import Action, Position, CellType
from algorithms.reinforce import REINFORCE


class REINFORCEDemo:
    """Interactive REINFORCE demonstration."""

    def __init__(self):
        self.env = Game1()
        self.renderer = PygameRenderer(self.env)

        # Create REINFORCE algorithm instance
        self.reinforce_algorithm = REINFORCE(
            gridworld=self.env,
            learning_rate=0.005,  # Reduced learning rate for more stable learning
            gamma=0.99,
            baseline=True
        )


        # Demo state
        self.show_probabilities = False
        self.last_episode_metrics = {}

        print("🎯 REINFORCE Policy Gradient Demo")
        print("=" * 50)
        print("Controls:")
        print("  SPACE: Run single episode")
        print("  1: Run 10 episodes")
        print("  2: Run 50 episodes")
        print("  3: Run 100 episodes")
        print("  P: Toggle policy probabilities")
        print("  V: Toggle value display")
        print("  R: Reset algorithm")
        print("  ESC: Quit")
        print()

    @beartype
    def _update_renderer_info(self) -> None:
        """Update renderer with current algorithm state."""
        # Update values and policy for visualization
        self.renderer.set_values(self.reinforce_algorithm.get_values())
        self.renderer.set_policy(self.reinforce_algorithm.get_policy())

    @beartype
    def run_single_episode(self) -> dict:
        """Run a single REINFORCE episode."""
        metrics = self.reinforce_algorithm.run_episode()
        self.last_episode_metrics = metrics
        self._update_renderer_info()
        return metrics

    @beartype
    def run_batch_episodes(self, num_episodes: int) -> None:
        """Run multiple episodes in batch with progress updates."""
        print(f"\n🚀 Running {num_episodes} episodes in batch...")

        start_episode = self.reinforce_algorithm.episode_count
        successful_episodes = 0
        total_reward = 0.0

        for i in range(num_episodes):
            metrics = self.reinforce_algorithm.run_episode()
            total_reward += metrics['reward']

            # Count successful episodes (reached goal)
            if metrics['reward'] > 0:
                successful_episodes += 1

            # Show progress every 10 episodes
            if (i + 1) % 10 == 0 or i == 0:
                print(f"  Episode {start_episode + i + 1}: "
                      f"Reward={metrics['reward']:+7.1f}, "
                      f"Length={metrics['length']:4d}, "
                      f"Avg={metrics['avg_reward']:+7.2f}")

        # Final batch summary
        avg_reward = total_reward / num_episodes
        success_rate = successful_episodes / num_episodes * 100

        print(f"\n📊 Batch Complete!")
        print(f"  • Episodes run: {num_episodes}")
        print(f"  • Success rate: {success_rate:.1f}% ({successful_episodes}/{num_episodes})")
        print(f"  • Average reward: {avg_reward:+7.2f}")
        print(f"  • Total episodes: {self.reinforce_algorithm.episode_count}")
        print()

        self._update_renderer_info()

    @beartype
    def print_episode_summary(self, metrics: dict) -> None:
        """Print detailed summary of the episode."""
        episode = metrics['episode']
        reward = metrics['reward']
        length = metrics['length']
        avg_reward = metrics.get('avg_reward', 0)
        baseline = metrics.get('baseline', 0)

        print(f"\n📈 Episode {episode} Summary:")
        print(f"  • Total reward: {reward:+7.1f}")
        print(f"  • Episode length: {length} steps")
        print(f"  • Average reward: {avg_reward:+7.2f}")
        print(f"  • Baseline value: {baseline:+7.2f}")

        # Show policy probabilities for start state
        start_pos = Position(0, 0)
        probs = self.reinforce_algorithm.get_action_probabilities(start_pos)
        print(f"  • Start state policy:")
        for action in Action:
            prob = probs[action.value]
            print(f"    {action.name:5s}: {prob:.3f}")
        print()

    @beartype
    def draw_policy_probabilities(self) -> None:
        """Draw action probabilities for each state."""
        if not self.show_probabilities:
            return

        for row in range(self.env.size):
            for col in range(self.env.size):
                pos = Position(row, col)

                # Skip obstacles
                if self.env.grid[row, col] == CellType.OBSTACLE:
                    continue

                # Get cell rectangle
                rect = self.renderer._get_cell_rect(row, col)

                # Get action probabilities
                probs = self.reinforce_algorithm.get_action_probabilities(pos)

                # Draw probabilities in corners
                positions = [
                    (rect.centerx, rect.top + 12),      # UP
                    (rect.centerx, rect.bottom - 12),   # DOWN
                    (rect.left + 12, rect.centery),     # LEFT
                    (rect.right - 12, rect.centery)     # RIGHT
                ]

                for action in Action:
                    prob = probs[action.value]

                    # Skip very low probabilities
                    if prob < 0.05:
                        continue

                    # Format probability text
                    prob_text = f"{prob:.2f}"

                    # Color based on probability (darker = higher)
                    intensity = int(255 * (1 - prob))
                    text_color = (intensity, intensity, 255)

                    # Render text
                    text_surf, text_rect = self.renderer._render_text(
                        self.renderer.small_font, prob_text, text_color
                    )

                    # Position text
                    pos_x, pos_y = positions[action.value]
                    text_rect.center = (pos_x, pos_y)

                    self.renderer.screen.blit(text_surf, text_rect)

    @beartype
    def draw_status_info(self) -> None:
        """Draw status information."""
        episode_data = self.reinforce_algorithm.get_episode_data()
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
        self.renderer.set_values(self.reinforce_algorithm.get_values())
        self.renderer.set_policy(self.reinforce_algorithm.get_policy())
        self._update_renderer_info()

        while running:
            # Handle events directly (don't use renderer.handle_events to avoid consuming events twice)
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                    continue
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        running = False
                        continue
                    elif event.key == pygame.K_SPACE:
                        print("🏃 Running single episode...")
                        metrics = self.run_single_episode()
                        self.print_episode_summary(metrics)
                        needs_redraw = True

                    elif event.key == pygame.K_1:
                        self.run_batch_episodes(10)
                        needs_redraw = True

                    elif event.key == pygame.K_2:
                        self.run_batch_episodes(50)
                        needs_redraw = True

                    elif event.key == pygame.K_3:
                        self.run_batch_episodes(100)
                        needs_redraw = True

                    elif event.key == pygame.K_p:
                        self.show_probabilities = not self.show_probabilities
                        print(f"📊 Policy probabilities: {'ON' if self.show_probabilities else 'OFF'}")
                        needs_redraw = True

                    elif event.key == pygame.K_v:
                        if self.renderer.show_values:
                            self.renderer.set_values(None)
                            print("📊 Value display: OFF")
                        else:
                            self.renderer.set_values(self.reinforce_algorithm.get_values())
                            print("📊 Value display: ON")
                        needs_redraw = True

                    elif event.key == pygame.K_r:
                        print("🔄 Resetting REINFORCE algorithm...")
                        self.reinforce_algorithm.reset()
                        self.renderer.set_values(self.reinforce_algorithm.get_values())
                        self.renderer.set_policy(self.reinforce_algorithm.get_policy())
                        self._update_renderer_info()
                        needs_redraw = True

            # Redraw if needed
            if needs_redraw:
                self.renderer.render()

                # Draw additional visualizations
                if self.show_probabilities:
                    self.draw_policy_probabilities()

                self.draw_status_info()

                pygame.display.flip()
                needs_redraw = False

            clock.tick(60)

        self.renderer.close()


def main():
    """Main entry point."""
    try:
        demo = REINFORCEDemo()
        demo.run()
    except KeyboardInterrupt:
        print("\n👋 Demo interrupted by user")
    except Exception as e:
        print(f"❌ Error running demo: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
