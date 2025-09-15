"""Replay system for visualizing recorded episodes."""

import time
from beartype import beartype
from environment.gridworld import GridWorld, Action, Position
from visualization.pygame_renderer import PygameRenderer
from .experience_recorder import Episode, ExperienceRecorder


class ReplaySystem:
    """System for replaying recorded episodes."""

    def __init__(self, gridworld: GridWorld, renderer: PygameRenderer):
        self.gridworld = gridworld
        self.renderer = renderer
        self.recorder = ExperienceRecorder()

    @beartype
    def replay_episode(self, episode_id: str, speed: float = 1.0) -> None:
        """Replay an episode with visualization."""
        try:
            episode = self.recorder.load_episode(episode_id)
        except FileNotFoundError:
            print(f"❌ Episode not found: {episode_id}")
            return

        print(f"🎬 Replaying episode: {episode_id}")
        print(f"   Algorithm: {episode.algorithm}")
        print(f"   Total reward: {episode.total_reward:.2f}")
        print(f"   Total steps: {episode.total_steps}")
        print(f"   Seed: {episode.seed}")
        print()

        # Reset environment to start position
        start_pos = Position(*episode.experiences[0].state)
        self.gridworld.reset(start_pos)

        step_delay = 0.5 / speed  # Base delay of 0.5 seconds

        for i, exp in enumerate(episode.experiences):
            print(f"Step {exp.step}: {Action(exp.action).name} -> Reward: {exp.reward:+.1f}")

            # Set agent position to match experience
            self.gridworld.agent_pos = Position(*exp.state)

            # Render current state
            self.renderer.render()

            # Handle events (allow quit)
            events = self.renderer.handle_events()
            if events["quit"]:
                print("🛑 Replay interrupted by user")
                return

            time.sleep(step_delay)

            # Take the action to show transition
            action = Action(exp.action)
            self.gridworld.step(action)

        # Final render
        self.renderer.render()
        print(f"✅ Replay completed for episode: {episode_id}")

    @beartype
    def list_available_episodes(self) -> None:
        """List all available episodes for replay."""
        episodes = self.recorder.list_episodes()

        if not episodes:
            print("📭 No episodes found")
            return

        print(f"📚 Available episodes ({len(episodes)}):")
        for episode_id in sorted(episodes):
            try:
                episode = self.recorder.load_episode(episode_id)
                print(f"  • {episode_id}")
                print(f"    Algorithm: {episode.algorithm}, Reward: {episode.total_reward:.2f}, Steps: {episode.total_steps}")
            except Exception as e:
                print(f"  • {episode_id} (error loading: {e})")
        print()
