"""Interactive play mode for human exploration of GridWorld.

uv run -m demos.play
"""

import sys
import numpy as np
from beartype import beartype
from environment import Action, GameStatus
from environment.game1 import Game1
from visualization import PygameRenderer


class GridWorldPlay:
    """Interactive play mode for the GridWorld environment."""

    def __init__(self):
        self.env = Game1()
        self.renderer = PygameRenderer(self.env)
        self.running = True
        self.jump_mode = False

        # Action emojis for logging
        self.action_emojis = {
            Action.UP: "⬆️",
            Action.DOWN: "⬇️",
            Action.LEFT: "⬅️",
            Action.RIGHT: "➡️",
        }

        # Demo value function (random for now)
        self.demo_values = np.random.rand(self.env.get_state_space_size()) * 10 - 5
        self.demo_policy = np.random.randint(0, 4, self.env.get_state_space_size())

    @beartype
    def run(self) -> None:
        """Run the interactive play mode."""
        print("🎮 GridWorld RL Environment - Play Mode")
        print(self.env.get_description())

        print("\n--- Environment Rules ---")
        print(f"Grid Size: {self.env.size}x{self.env.size}")
        print("Rewards:")
        print(f"  - Goal: +{self.env.goal_reward} | Trap: {self.env.trap_penalty} | Wall: {self.env.wall_penalty} | Step: {self.env.step_penalty}")
        print("Special Rules:")
        print("  - Land on a Jump Pad (J) to get a one-time, 2-space JUMP.")
        print("-------------------------\n")

        print("Controls:")
        print("  - Arrow Keys: Move | Space: Use Jump | R: Reset | ESC: Quit")
        print("  - V: Toggle Values | P: Toggle Policy\n")

        self.env.reset()
        print("Step 0: Position: (0,0), R:0.0, Score: 0.0")

        while self.running:
            events = self.renderer.handle_events()

            if events["quit"]:
                self.running = False
                continue

            if events["reset"]:
                self.env.reset()
                self.jump_mode = False
                print(f"🔄 Environment reset.")
                print("Step 0: Position: (0,0), R:0.0, Score: 0.0")

            if self.env.status == GameStatus.RUNNING and events["use_jump"] and self.env.has_jump:
                self.jump_mode = not self.jump_mode
                self.renderer.set_jump_mode(self.jump_mode)

            # Handle movement
            action = None
            if self.env.status == GameStatus.RUNNING:
                if events["move_up"]:
                    action = Action.UP
                elif events["move_down"]:
                    action = Action.DOWN
                elif events["move_left"]:
                    action = Action.LEFT
                elif events["move_right"]:
                    action = Action.RIGHT

            if action is not None:
                result = self.env.step(action, use_jump=self.jump_mode)

                if self.jump_mode:
                    self.jump_mode = False
                    self.renderer.set_jump_mode(False)

                log_line1 = (
                    f"Step {result.info['episode_steps']}: "
                    f"Position: ({result.next_state.row},{result.next_state.col}), "
                    f"R:{result.reward:+.1f}, "
                    f"Score: {self.env.total_reward:.1f}"
                )

                event_type = "MOVE"
                if result.info["collision"]:
                    event_type = "HITWALL"
                elif result.info["jump_used"]:
                    event_type = "JUMP"
                elif result.info.get("teleported", False):
                    event_type = "TELEPORT"
                elif result.done:
                    if result.reward > self.env.step_penalty:
                        event_type = "GOAL"
                    else:
                        event_type = "TRAP"

                action_emoji = self.action_emojis.get(action, "❔")
                log_line2 = f"    Action: {action_emoji}, {event_type}"

                print(log_line1)
                print(log_line2)

                if self.env.status == GameStatus.DONE:
                    print("🏁 Episode finished. Press R to reset.")

            # Toggle visualization modes
            if events["toggle_values"]:
                if self.renderer.show_values:
                    self.renderer.set_values(None)
                    print("📊 Value heatmap disabled")
                else:
                    self.renderer.set_values(self.demo_values)
                    print("📊 Value heatmap enabled (demo values)")

            if events["toggle_policy"]:
                if self.renderer.show_policy:
                    self.renderer.set_policy(None)
                    print("🏹 Policy arrows disabled")
                else:
                    self.renderer.set_policy(self.demo_policy)
                    print("🏹 Policy arrows enabled (demo policy)")

            self.renderer.render()
            self.renderer.clock.tick(60)

        self.renderer.close()
        print("👋 Goodbye!")


def main():
    """Main function."""
    try:
        play = GridWorldPlay()
        play.run()
    except KeyboardInterrupt:
        print("\n👋 Interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
