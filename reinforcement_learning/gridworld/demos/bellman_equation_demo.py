"""Interactive Bellman equation exploration and visualization.

uv run python bellman_equation_demo.py
"""

import sys
import numpy as np
from beartype import beartype
from environment.game1 import Game1
from environment.transition_model import TransitionModel
from visualization.pygame_renderer import PygameRenderer
from environment.gridworld import Action, Position, CellType
import pygame


class BellmanEquationDemo:
    """Interactive demonstration of the Bellman equation components."""

    def __init__(self):
        self.env = Game1()
        self.renderer = PygameRenderer(self.env)
        self.transition_model = TransitionModel(self.env)

        # Bellman equation parameters
        self.gamma = 0.9  # Discount factor (adjustable)

        # Example value function (you can modify these)
        self.values = self._create_example_values()

        # UI state
        self.selected_state = None
        self.selected_action = None
        self.show_equation_breakdown = False
        self.gamma_adjustment_mode = False

        print("🧮 Bellman Equation Explorer")
        print("=" * 50)
        print("🎯 Goal: Understand V(s) = max_a Σ P(s',r|s,a)[r + γV(s')]")
        print()
        print("📚 EDUCATIONAL PURPOSE:")
        print("   • This is NOT an algorithm - it's equation exploration")
        print("   • Values are STATIC (not being learned)")
        print("   • Focus on understanding each component of the equation")
        print()
        print("Controls:")
        print("  Click state: Select state to analyze")
        print("  G: Adjust gamma (discount factor)")
        print("  V: Randomize value function")
        print("  R: Reset to example values")
        print("  ESC: Quit")
        print()
        print("💡 Click any state to see its Bellman equation breakdown!")
        print("🔄 For actual DP algorithm, run: python run_dp_demo.py")

    @beartype
    def _create_example_values(self) -> np.ndarray:
        """Create an example value function for demonstration."""
        values = np.zeros(self.env.get_state_space_size())

        # Create a simple gradient toward the goal
        goal_pos = None
        for state in range(self.env.get_state_space_size()):
            pos = self.env.state_to_position(state)
            if self.env.grid[pos.row, pos.col] == CellType.GOAL:
                goal_pos = pos
                break

        if goal_pos:
            for state in range(self.env.get_state_space_size()):
                pos = self.env.state_to_position(state)
                if self.env.grid[pos.row, pos.col] == CellType.OBSTACLE:
                    values[state] = 0
                elif self.env.grid[pos.row, pos.col] in [CellType.GOAL, CellType.TRAP]:
                    values[state] = 0  # Terminal states
                else:
                    # Distance-based value (closer to goal = higher value)
                    distance = abs(pos.row - goal_pos.row) + abs(pos.col - goal_pos.col)
                    values[state] = max(0, 5.0 - distance * 0.5)

        return values

    @beartype
    def get_bellman_breakdown(self, state: int, action: Action | None = None) -> dict:
        """Get detailed Bellman equation breakdown for a state."""
        pos = self.env.state_to_position(state)

        # Check if terminal
        if self.env.grid[pos.row, pos.col] in [CellType.GOAL, CellType.TRAP]:
            cell_type = "GOAL" if self.env.grid[pos.row, pos.col] == CellType.GOAL else "TRAP"
            return {
                "state": state,
                "position": pos,
                "is_terminal": True,
                "cell_type": cell_type,
                "explanation": f"Terminal state: V({state}) = 0 by definition"
            }

        # Get action values for all actions
        action_breakdowns = []
        for act in Action:
            transition = self.transition_model.get_transition(state, act.value)
            next_state = transition.next_state
            reward = transition.reward
            next_value = self.values[next_state]

            # Calculate Q(s,a) = r + γV(s')
            q_value = reward + self.gamma * next_value

            next_pos = self.env.state_to_position(next_state)
            action_breakdowns.append({
                "action": act,
                "reward": reward,
                "next_state": next_state,
                "next_pos": next_pos,
                "next_value": next_value,
                "gamma": self.gamma,
                "q_value": q_value,
                "calculation": f"{reward:+.1f} + {self.gamma:.1f}×{next_value:.2f} = {q_value:.2f}"
            })

        # Find best action
        best_q = max(ab["q_value"] for ab in action_breakdowns)
        best_actions = [ab for ab in action_breakdowns if ab["q_value"] == best_q]

        return {
            "state": state,
            "position": pos,
            "is_terminal": False,
            "current_value": self.values[state],
            "bellman_value": best_q,
            "action_breakdowns": action_breakdowns,
            "best_actions": best_actions,
            "gamma": self.gamma
        }

    @beartype
    def print_bellman_analysis(self, breakdown: dict) -> None:
        """Print detailed Bellman equation analysis."""
        pos = breakdown["position"]
        state = breakdown["state"]

        print(f"\n🔍 Bellman Equation Analysis: State {state} at ({pos.row},{pos.col})")
        print("=" * 60)

        if breakdown["is_terminal"]:
            print(f"Terminal {breakdown['cell_type']} state: V({state}) = 0.00")
            print("(Terminal states have no future value by definition)")
            return

        print(f"Current V({state}) = {breakdown['current_value']:.3f}")
        print(f"Bellman equation: V({state}) = max_a [r + γV(s')]")
        print(f"With γ = {breakdown['gamma']:.1f}")
        print()

        print("Action Analysis:")
        print("-" * 40)

        for i, ab in enumerate(breakdown["action_breakdowns"]):
            action_name = ab["action"].name
            is_best = ab in breakdown["best_actions"]
            marker = "★" if is_best else " "

            print(f"{marker} {action_name:>5}: Q({state},{ab['action'].value}) = {ab['calculation']}")
            print(f"        → State {ab['next_state']} at ({ab['next_pos'].row},{ab['next_pos'].col})")

            # Explain the transition
            if ab["reward"] != -0.1:  # Not just step cost
                if ab["reward"] > 0:
                    print(f"        💰 Positive reward: {ab['reward']:+.1f}")
                else:
                    print(f"        💸 Penalty: {ab['reward']:+.1f}")

            print()

        print(f"Bellman Result: V({state}) = max(...) = {breakdown['bellman_value']:.3f}")

        current_diff = abs(breakdown['current_value'] - breakdown['bellman_value'])
        if current_diff > 0.01:
            print(f"⚠️  Current V({state}) = {breakdown['current_value']:.3f} ≠ Bellman value!")
            print(f"   This suggests the value function is not optimal")
        else:
            print(f"✅ Current value matches Bellman calculation (optimal!)")

        if len(breakdown["best_actions"]) == 1:
            best_action = breakdown["best_actions"][0]["action"]
            print(f"Best action: {best_action.name}")
        else:
            actions = [ba["action"].name for ba in breakdown["best_actions"]]
            print(f"Tied best actions: {', '.join(actions)}")

    @beartype
    def handle_mouse_click(self, pos: tuple[int, int]) -> None:
        """Handle mouse click to select state."""
        grid_x = (pos[0] - self.renderer.grid_offset_x) // self.renderer.cell_size
        grid_y = (pos[1] - self.renderer.grid_offset_y) // self.renderer.cell_size

        if 0 <= grid_x < self.env.size and 0 <= grid_y < self.env.size:
            self.selected_state = self.env.position_to_state(Position(grid_y, grid_x))
            self.selected_action = None

            # Print analysis
            breakdown = self.get_bellman_breakdown(self.selected_state)
            self.print_bellman_analysis(breakdown)

    @beartype
    def adjust_gamma(self) -> None:
        """Interactively adjust gamma value."""
        print(f"\n🎛️  Gamma Adjustment Mode")
        print(f"Current γ = {self.gamma:.1f}")
        print("Use UP/DOWN arrows to adjust, ENTER to confirm, ESC to cancel")
        self.gamma_adjustment_mode = True

    @beartype
    def randomize_values(self) -> None:
        """Create random value function for experimentation."""
        self.values = np.random.uniform(-2, 8, self.env.get_state_space_size())

        # Keep terminal states at 0
        for state in range(self.env.get_state_space_size()):
            pos = self.env.state_to_position(state)
            if self.env.grid[pos.row, pos.col] in [CellType.GOAL, CellType.TRAP, CellType.OBSTACLE]:
                self.values[state] = 0

        self.renderer.set_values(self.values)
        print("🎲 Randomized value function! Click states to see new Bellman calculations.")

    @beartype
    def run(self) -> None:
        """Run the interactive demonstration."""
        clock = pygame.time.Clock()
        running = True

        # Initial setup - disable automatic heatmap updates to prevent blinking
        self.renderer.show_values = True
        self.renderer.set_values(self.values)

        print("🎯 This demo explores the Bellman equation with a STATIC value function")
        print("   (No algorithm is running - just pure equation analysis!)")
        print()

        while running:
            # Handle events
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False

                elif event.type == pygame.KEYDOWN:
                    if self.gamma_adjustment_mode:
                        if event.key == pygame.K_UP:
                            self.gamma = min(1.0, self.gamma + 0.1)
                            print(f"γ = {self.gamma:.1f}")
                        elif event.key == pygame.K_DOWN:
                            self.gamma = max(0.0, self.gamma - 0.1)
                            print(f"γ = {self.gamma:.1f}")
                        elif event.key == pygame.K_RETURN:
                            self.gamma_adjustment_mode = False
                            print(f"✅ Gamma set to {self.gamma:.1f}")
                            if self.selected_state is not None:
                                breakdown = self.get_bellman_breakdown(self.selected_state)
                                self.print_bellman_analysis(breakdown)
                        elif event.key == pygame.K_ESCAPE:
                            self.gamma_adjustment_mode = False
                            print("❌ Gamma adjustment cancelled")
                    else:
                        if event.key == pygame.K_ESCAPE:
                            running = False
                        elif event.key == pygame.K_g:
                            self.adjust_gamma()
                        elif event.key == pygame.K_v:
                            self.randomize_values()
                        elif event.key == pygame.K_r:
                            self.values = self._create_example_values()
                            self.renderer.set_values(self.values)
                            print("🔄 Reset to example values")
                        elif event.key == pygame.K_SPACE:
                            self.show_equation_breakdown = not self.show_equation_breakdown
                            print(f"Equation breakdown: {'ON' if self.show_equation_breakdown else 'OFF'}")
                        elif event.key in [pygame.K_1, pygame.K_2, pygame.K_3, pygame.K_4]:
                            if self.selected_state is not None:
                                action_idx = event.key - pygame.K_1
                                self.selected_action = Action(action_idx)
                                print(f"Selected action: {self.selected_action.name}")

                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 1:  # Left click
                        self.handle_mouse_click(event.pos)

            # Render
            self.renderer.render()

            # Draw value text
            self._draw_value_text()

            # Draw status
            if self.gamma_adjustment_mode:
                status = f"Gamma Adjustment: {self.gamma:.1f} (UP/DOWN to change, ENTER to confirm)"
            elif self.selected_state is not None:
                pos = self.env.state_to_position(self.selected_state)
                status = f"Selected: State {self.selected_state} at ({pos.row},{pos.col}) | γ={self.gamma:.1f}"
            else:
                status = f"Click any state to explore Bellman equation | γ={self.gamma:.1f}"

            # Render status text
            try:
                text_surf, _ = self.renderer._render_text(self.renderer.font, status, (0, 0, 0))
                self.renderer.screen.blit(text_surf, (10, 10))
            except Exception:
                font = pygame.font.Font(None, 24)
                text_surf = font.render(status, True, (0, 0, 0))
                self.renderer.screen.blit(text_surf, (10, 10))

            pygame.display.flip()
            clock.tick(30)  # Lower frame rate since this is static exploration

        self.renderer.close()
        print("👋 Bellman exploration finished!")

    @beartype
    def _draw_value_text(self) -> None:
        """Draw value numbers on tiles."""
        for state in range(self.env.get_state_space_size()):
            pos = self.env.state_to_position(state)
            value = self.values[state]

            if self.env.grid[pos.row, pos.col] == CellType.OBSTACLE:
                continue

            rect = self.renderer._get_cell_rect(pos.row, pos.col)

            # Highlight selected state
            if state == self.selected_state:
                pygame.draw.rect(self.renderer.screen, (255, 255, 0), rect, 3)

            # Format and draw value
            if abs(value) < 0.001:
                value_text = "0.00"
            else:
                value_text = f"{value:.2f}"

            text_color = (255, 255, 255)

            try:
                text_surf, text_rect = self.renderer._render_text(
                    self.renderer.small_font, value_text, text_color
                )
                text_rect.bottomright = (rect.right - 2, rect.bottom - 2)
                self.renderer.screen.blit(text_surf, text_rect)
            except Exception:
                font = pygame.font.Font(None, 14)
                text_surf = font.render(value_text, True, text_color)
                text_rect = text_surf.get_rect()
                text_rect.bottomright = (rect.right - 2, rect.bottom - 2)
                self.renderer.screen.blit(text_surf, text_rect)


def main():
    """Main function."""
    try:
        demo = BellmanEquationDemo()
        demo.run()
    except KeyboardInterrupt:
        print("\n👋 Interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
