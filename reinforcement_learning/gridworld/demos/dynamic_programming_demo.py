"""Interactive Dynamic Programming (Value Iteration) demonstration.

uv run python -m demos.dynamic_programming_demo
"""

import sys
import numpy as np
from beartype import beartype
import pygame

from environment.game1 import Game1
from visualization.pygame_renderer import PygameRenderer
from environment.gridworld import Action, Position, CellType
from algorithms.dynamic_programming import DynamicProgramming


class DynamicProgrammingDemo:
    """Interactive Dynamic Programming demonstration."""

    def __init__(self):
        self.env = Game1()
        self.renderer = PygameRenderer(self.env)

        # Create DP algorithm instance
        self.dp_algorithm = DynamicProgramming(
            gridworld=self.env,
            gamma=1.0,
            theta=0.001,
            max_iterations=100
        )

        # Visualization state
        self.selected_state = None
        self.show_calculation = False
        self.show_value_text = True  # Show values as text on tiles

        print("🧮 Dynamic Programming Demo")
        print("=" * 40)
        print("Controls:")
        print("  SPACE: Single step iteration")
        print("  T: Toggle value text display")
        print("  R: Reset to iteration 0")
        print("  Click: Inspect state calculation")
        print("  ESC: Quit")
        print()

    @beartype
    def get_state_calculation(self, state: int) -> dict:
        """Get detailed Bellman calculation for a state."""
        return self.dp_algorithm.get_state_calculation(state)

    @beartype
    def value_iteration_step(self) -> float:
        """Perform one step of value iteration."""
        old_values = self.dp_algorithm.get_values()
        old_policy = self.dp_algorithm.get_policy()
        delta = self.dp_algorithm._value_iteration_step()
        new_values = self.dp_algorithm.get_values()
        new_policy = self.dp_algorithm.get_policy()

        # Track changes for detailed reporting
        significant_changes = []
        policy_changes = 0

        for state in range(self.env.get_state_space_size()):
            pos = self.env.state_to_position(state)
            old_value = old_values[state]
            old_policy_action = old_policy[state] if len(old_policy) > 0 else 0

            # Track significant changes
            value_change = abs(new_values[state] - old_value)
            if value_change > 0.01:  # Only show significant changes
                significant_changes.append({
                    "state": state,
                    "pos": pos,
                    "old_value": old_value,
                    "new_value": new_values[state],
                    "change": value_change,
                    "best_action": Action(new_policy[state])
                })

            # Track policy changes
            if new_policy[state] != old_policy_action:
                policy_changes += 1

        # Print detailed iteration information
        self.print_iteration_details(significant_changes, policy_changes, delta)

        return delta

    @beartype
    def print_iteration_details(self, changes: list, policy_changes: int, delta: float) -> None:
        """Print detailed information about the current iteration."""
        print(f"\n📊 Iteration {self.dp_algorithm.iteration} Details:")
        print(f"   Max value change: {delta:.6f}")
        print(f"   Policy changes: {policy_changes} states")
        print(f"   Significant updates: {len(changes)} states")

        if changes:
            print(f"\n   Top value changes:")
            # Sort by change magnitude and show top 5
            changes.sort(key=lambda x: x["change"], reverse=True)
            for i, change in enumerate(changes[:5]):
                pos = change["pos"]
                print(f"   {i+1}. State ({pos.row},{pos.col}): "
                      f"{change['old_value']:6.3f} → {change['new_value']:6.3f} "
                      f"(Δ{change['change']:+.3f}) "
                      f"[{change['best_action'].name}]")

        # Show value statistics
        values = self.dp_algorithm.get_values()
        non_zero_values = values[values != 0]
        if len(non_zero_values) > 0:
            print(f"   Value range: [{np.min(non_zero_values):6.3f}, {np.max(non_zero_values):6.3f}]")
            print(f"   Mean value: {np.mean(non_zero_values):6.3f}")

        print("-" * 60)

    @beartype
    def print_calculation_details(self, calc: dict) -> None:
        """Print detailed calculation for a state."""
        pos = calc["position"]
        print(f"\n🔍 Bellman Calculation for State {calc['state']} at ({pos.row},{pos.col})")
        print("=" * 50)

        if calc["is_terminal"]:
            cell_type = "GOAL" if self.env.grid[pos.row, pos.col] == CellType.GOAL else "TRAP"
            entry_reward = calc.get("entry_reward", 0.0)
            print(f"Terminal state ({cell_type}): V({calc['state']}) = 0.00 (by definition)")
            print(f"  Entry reward on transition into this state: {entry_reward:+.2f}")
            return

        print(f"Current V({calc['state']}) = {calc['current_value']:.3f}")
        print(f"Bellman equation: V*({calc['state']}) = max_a Σ P(s',r|s,a)[r + γV*(s')]")
        print()

        for i, av in enumerate(calc["action_values"]):
            action_name = av["action"].name
            is_best = (i == calc["best_action_idx"])
            marker = "★" if is_best else " "

            print(f"{marker} {action_name:>5}: {av['value']:6.3f}")

            for t in av["transitions"]:
                next_pos = t["next_pos"]
                print(f"    → ({next_pos.row},{next_pos.col}): P={t['probability']:.1f} × "
                      f"[r={t['reward']:+.1f} + γ×{t['next_value']:6.3f}] = {t['contribution']:6.3f}")

        print(f"\nNew V({calc['state']}) = max(...) = {calc['new_value']:.3f}")
        print(f"Best action: {calc['best_action'].name}")

    @beartype
    def handle_mouse_click(self, pos: tuple[int, int]) -> None:
        """Handle mouse click to select state."""
        # Convert screen coordinates to grid position
        grid_x = (pos[0] - self.renderer.grid_offset_x) // self.renderer.cell_size
        grid_y = (pos[1] - self.renderer.grid_offset_y) // self.renderer.cell_size

        if 0 <= grid_x < self.env.size and 0 <= grid_y < self.env.size:
            self.selected_state = self.env.position_to_state(Position(grid_y, grid_x))
            self.show_calculation = True

            # Print calculation details
            calc = self.get_state_calculation(self.selected_state)
            self.print_calculation_details(calc)

    @beartype
    def run(self) -> None:
        """Run the interactive demonstration."""
        clock = pygame.time.Clock()
        running = True

        # Initial setup
        self.renderer.set_values(self.dp_algorithm.get_values())
        self.renderer.set_policy(self.dp_algorithm.get_policy())

        print(f"Iteration {self.dp_algorithm.iteration}: Starting value iteration")
        print("Click on any state to see its Bellman calculation!")

        while running:
            # Handle events
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        running = False
                    elif event.key == pygame.K_SPACE and not self.dp_algorithm.converged:
                        # Single step
                        delta = self.value_iteration_step()

                        if delta < self.dp_algorithm.theta:
                            print(f"\n🎉 CONVERGED after {self.dp_algorithm.iteration} iterations!")
                            print(f"Final max change: {delta:.6f} < threshold {self.dp_algorithm.theta}")
                            print("Click on states to inspect their final calculations.")
                            self.print_final_summary()

                        self.renderer.set_values(self.dp_algorithm.get_values())
                        self.renderer.set_policy(self.dp_algorithm.get_policy())

                    elif event.key == pygame.K_t:
                        # Toggle value text display
                        self.show_value_text = not self.show_value_text
                        print(f"Value text: {'ON' if self.show_value_text else 'OFF'}")

                    elif event.key == pygame.K_r:
                        # Reset
                        self.dp_algorithm.reset()
                        self.selected_state = None
                        self.show_calculation = False

                        self.renderer.set_values(self.dp_algorithm.get_values())
                        self.renderer.set_policy(self.dp_algorithm.get_policy())
                        print("🔄 Reset to iteration 0")

                elif event.type == pygame.MOUSEBUTTONDOWN:
                    if event.button == 1:  # Left click
                        self.handle_mouse_click(event.pos)

            # Render
            self.renderer.render()

            # Draw value text on tiles if enabled
            if self.show_value_text:
                self.draw_value_text()

            # Draw status text
            if self.dp_algorithm.converged:
                status = f"CONVERGED (Iteration {self.dp_algorithm.iteration})"
            else:
                status = f"Iteration {self.dp_algorithm.iteration} - Press SPACE to step"

            # Use the renderer's text rendering method
            text_surf, _ = self.renderer._render_text(self.renderer.font, status, (0, 0, 0))
            self.renderer.screen.blit(text_surf, (10, 10))

            pygame.display.flip()
            clock.tick(60)

        self.renderer.close()
        print("👋 Demo finished!")

    @beartype
    def print_final_summary(self) -> None:
        """Print final summary of the converged solution."""
        print(f"\n🏆 FINAL SOLUTION SUMMARY:")
        print("=" * 50)

        # Find goal and trap states
        goal_states = []
        trap_states = []
        for state in range(self.env.get_state_space_size()):
            pos = self.env.state_to_position(state)
            if self.env.grid[pos.row, pos.col] == CellType.GOAL:
                goal_states.append((state, pos))
            elif self.env.grid[pos.row, pos.col] == CellType.TRAP:
                trap_states.append((state, pos))

        # Show optimal path from start
        start_state = self.env.position_to_state(Position(0, 0))
        print(f"\nOptimal path from start (0,0):")
        current_state = start_state
        path = []
        visited = set()

        for step in range(20):  # Prevent infinite loops
            if current_state in visited:
                print("   (Cycle detected - stopping)")
                break
            visited.add(current_state)

            pos = self.env.state_to_position(current_state)
            values = self.dp_algorithm.get_values()
            policy = self.dp_algorithm.get_policy()
            value = values[current_state]
            action = Action(policy[current_state])

            path.append(f"({pos.row},{pos.col})")
            print(f"   Step {step}: ({pos.row},{pos.col}) V={value:6.3f} → {action.name}")

            # Check if terminal
            if self.env.grid[pos.row, pos.col] in [CellType.GOAL, CellType.TRAP]:
                break

            # Move to next state
            transition = self.dp_algorithm.transition_model.get_transition(current_state, action.value)
            current_state = transition.next_state

        print(f"\nPath: {' → '.join(path)}")

        # Value statistics
        values = self.dp_algorithm.get_values()
        non_zero_values = values[values != 0]
        if len(non_zero_values) > 0:
            print(f"\nValue function statistics:")
            print(f"   Highest value: {np.max(values):6.3f}")
            print(f"   Lowest value:  {np.min(non_zero_values):6.3f}")
            print(f"   Average value: {np.mean(non_zero_values):6.3f}")

        print("=" * 50)

    @beartype
    def draw_value_text(self) -> None:
        """Draw value numbers on each tile (bottom-right, no shadow)."""
        values = self.dp_algorithm.get_values()
        for state in range(self.env.get_state_space_size()):
            pos = self.env.state_to_position(state)
            value = values[state]

            # Skip obstacles (they have value 0 and aren't interesting)
            if self.env.grid[pos.row, pos.col] == CellType.OBSTACLE:
                continue

            # Get tile rectangle
            rect = self.renderer._get_cell_rect(pos.row, pos.col)

            # Format value text
            if abs(value) < 0.001:
                value_text = "0.00"
            else:
                value_text = f"{value:.2f}"

            # Use consistent white text for better visibility
            text_color = (255, 255, 255)

            # Render text
            text_surf, text_rect = self.renderer._render_text(
                self.renderer.small_font, value_text, text_color
            )
            # Position at bottom-right of tile
            text_rect.bottomright = (rect.right - 2, rect.bottom - 2)

            # Draw the text directly (no background/shadow)
            self.renderer.screen.blit(text_surf, text_rect)


def main():
    """Main function."""
    demo = DynamicProgrammingDemo()
    demo.run()


if __name__ == "__main__":
    main()
