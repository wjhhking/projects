"""Replay recorded experiences with visualization.

uv run -m demos.replay
"""

import sys
from beartype import beartype
from environment.game1 import Game1
from visualization.pygame_renderer import PygameRenderer
from utils.replay_system import ReplaySystem


@beartype
def list_episodes() -> None:
    """List all available episodes."""
    env = Game1()
    renderer = PygameRenderer(env)
    replay_system = ReplaySystem(env, renderer)

    try:
        replay_system.list_available_episodes()
    finally:
        renderer.close()


@beartype
def replay_episode(episode_id: str) -> None:
    """Replay a specific episode."""
    env = Game1()
    renderer = PygameRenderer(env)
    replay_system = ReplaySystem(env, renderer)

    try:
        replay_system.replay_episode(episode_id, speed=1.0)

        # Keep window open until user closes it
        print("Press ESC or close window to exit...")
        running = True
        while running:
            events = renderer.handle_events()
            if events["quit"]:
                running = False
            renderer.render()
            renderer.clock.tick(60)

    finally:
        renderer.close()


def main():
    """Main function."""
    if len(sys.argv) < 2:
        print("📚 Available episodes:")
        list_episodes()
        print("\n🎬 Usage:")
        print("  python replay.py <episode_id>")
        print("  python replay.py list")
        return

    command = sys.argv[1]

    try:
        if command == "list":
            list_episodes()
        else:
            # Treat as episode ID
            replay_episode(command)
    except KeyboardInterrupt:
        print("\n👋 Interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
