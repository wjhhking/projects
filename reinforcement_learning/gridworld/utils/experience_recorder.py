"""Experience recording system for storing and replaying episodes."""

import json
import os
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any
from beartype import beartype
from environment.gridworld import Action, Position


@dataclass
class Experience:
    """Single step experience in an episode."""
    step: int
    state: tuple[int, int]  # (row, col)
    action: int  # Action enum value
    reward: float
    next_state: tuple[int, int]
    done: bool
    info: dict[str, Any]


@dataclass
class Episode:
    """Complete episode with metadata."""
    episode_id: str
    algorithm: str
    seed: int | None
    total_reward: float
    total_steps: int
    start_time: str
    end_time: str
    experiences: list[Experience]
    metadata: dict[str, Any]


class ExperienceRecorder:
    """Records and manages episode experiences."""

    def __init__(self, save_dir: str = "experiences"):
        self.save_dir = save_dir
        self.current_episode: list[Experience] = []
        self.episode_metadata: dict[str, Any] = {}
        os.makedirs(save_dir, exist_ok=True)

    @beartype
    def start_episode(self, algorithm_name: str, seed: int | None = None, **metadata) -> None:
        """Start recording a new episode."""
        self.current_episode = []
        self.episode_metadata = {
            "algorithm": algorithm_name,
            "seed": seed,
            "start_time": datetime.now().isoformat(),
            **metadata
        }

    @beartype
    def record_step(
        self,
        step: int,
        state: Position,
        action: Action,
        reward: float,
        next_state: Position,
        done: bool,
        info: dict[str, Any]
    ) -> None:
        """Record a single step experience."""
        experience = Experience(
            step=step,
            state=(state.row, state.col),
            action=action.value,
            reward=reward,
            next_state=(next_state.row, next_state.col),
            done=done,
            info=info.copy()
        )
        self.current_episode.append(experience)

    @beartype
    def end_episode(self, total_reward: float) -> str:
        """End episode recording and save to file."""
        if not self.current_episode:
            raise ValueError("No experiences recorded in current episode")

        episode_id = f"{self.episode_metadata['algorithm']}_{datetime.now().strftime('%Y%m%d_%H%M%S_%f')}"

        episode = Episode(
            episode_id=episode_id,
            algorithm=self.episode_metadata["algorithm"],
            seed=self.episode_metadata.get("seed"),
            total_reward=total_reward,
            total_steps=len(self.current_episode),
            start_time=self.episode_metadata["start_time"],
            end_time=datetime.now().isoformat(),
            experiences=self.current_episode.copy(),
            metadata=self.episode_metadata.copy()
        )

        # Save to file
        filename = f"{episode_id}.json"
        filepath = os.path.join(self.save_dir, filename)

        # Convert to dict and handle numpy types
        episode_dict = asdict(episode)

        def convert_numpy_types(obj):
            """Convert numpy types to native Python types."""
            if hasattr(obj, 'item'):  # numpy scalar
                return obj.item()
            elif isinstance(obj, dict):
                return {k: convert_numpy_types(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_numpy_types(v) for v in obj]
            return obj

        episode_dict = convert_numpy_types(episode_dict)

        with open(filepath, 'w') as f:
            json.dump(episode_dict, f, indent=2)

        print(f"💾 Episode saved: {filepath}")
        return episode_id

    @beartype
    def load_episode(self, episode_id: str) -> Episode:
        """Load an episode from file."""
        filename = f"{episode_id}.json"
        filepath = os.path.join(self.save_dir, filename)

        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Episode file not found: {filepath}")

        with open(filepath, 'r') as f:
            data = json.load(f)

        # Convert experiences back to Experience objects
        experiences = [Experience(**exp) for exp in data["experiences"]]
        data["experiences"] = experiences

        return Episode(**data)

    @beartype
    def list_episodes(self) -> list[str]:
        """List all available episode IDs."""
        if not os.path.exists(self.save_dir):
            return []

        episode_files = [f for f in os.listdir(self.save_dir) if f.endswith('.json')]
        return [f[:-5] for f in episode_files]  # Remove .json extension
