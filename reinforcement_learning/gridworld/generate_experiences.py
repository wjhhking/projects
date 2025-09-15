"""Generate random strategy experiences for testing and demonstration."""

import sys
from beartype import beartype
from environment.game1 import Game1
from algorithms.random_strategy import RandomStrategy
from utils.experience_recorder import ExperienceRecorder


@beartype
def run_episode(algorithm: RandomStrategy, env: Game1, recorder: ExperienceRecorder, episode_num: int) -> float:
    """Run a single episode and record experiences."""
    seed = 42 + episode_num  # Different seed for each episode
    algorithm.seed = seed

    recorder.start_episode(
        algorithm_name=algorithm.name,
        seed=seed,
        episode_number=episode_num,
        environment="Game1"
    )

    env.reset()
    total_reward = 0.0
    step = 0

    print(f"🎮 Episode {episode_num + 1}: Starting at {env.agent_pos}")

    while env.status.name == "RUNNING" and step < 1000:  # Max 1000 steps to prevent infinite loops
        current_state = env.agent_pos
        action = algorithm.select_action(current_state)

        result = env.step(action)
        step += 1
        total_reward += result.reward

        # Record the experience
        recorder.record_step(
            step=step,
            state=current_state,
            action=action,
            reward=result.reward,
            next_state=result.next_state,
            done=result.done,
            info=result.info
        )

        # Log step
        action_emojis = {"UP": "⬆️", "DOWN": "⬇️", "LEFT": "⬅️", "RIGHT": "➡️"}
        action_emoji = action_emojis.get(action.name, "❔")

        event_type = "MOVE"
        if result.info["collision"]:
            event_type = "HITWALL"
        elif result.info["jump_used"]:
            event_type = "JUMP"
        elif result.info.get("teleported", False):
            event_type = "TELEPORT"
        elif result.done:
            if result.reward > env.step_penalty:
                event_type = "GOAL"
            else:
                event_type = "TRAP"

        print(f"  Step {step}: {action_emoji} {event_type} -> R:{result.reward:+.1f} (Total: {total_reward:.1f})")

        if result.done:
            break

    episode_id = recorder.end_episode(total_reward)
    print(f"✅ Episode {episode_num + 1} completed: {total_reward:.2f} reward in {step} steps")
    print(f"   Saved as: {episode_id}")
    print()

    return total_reward


@beartype
def generate_experiences(num_episodes: int = 10) -> None:
    """Generate multiple episodes of random strategy experiences."""
    print("🎯 Generating Random Strategy Experiences")
    print("=" * 50)

    env = Game1()
    algorithm = RandomStrategy(env)
    recorder = ExperienceRecorder()

    print(f"Environment: {env.get_description()}")
    print(f"Algorithm: {algorithm.get_description()}")
    print(f"Episodes to generate: {num_episodes}")
    print()

    total_rewards = []

    for i in range(num_episodes):
        reward = run_episode(algorithm, env, recorder, i)
        total_rewards.append(reward)

    # Summary statistics
    avg_reward = sum(total_rewards) / len(total_rewards)
    max_reward = max(total_rewards)
    min_reward = min(total_rewards)

    print("📊 Summary Statistics:")
    print(f"   Average reward: {avg_reward:.2f}")
    print(f"   Best episode: {max_reward:.2f}")
    print(f"   Worst episode: {min_reward:.2f}")
    print()

    # List generated episodes
    episodes = recorder.list_episodes()
    print(f"📚 Generated {len(episodes)} episodes:")
    for episode_id in sorted(episodes)[-num_episodes:]:  # Show last N episodes
        print(f"   • {episode_id}")

    print("\n🎬 To replay an episode, use:")
    print("   python main.py --replay <episode_id>")


def main():
    """Main function."""
    try:
        num_episodes = 10
        if len(sys.argv) > 1:
            num_episodes = int(sys.argv[1])

        generate_experiences(num_episodes)
    except KeyboardInterrupt:
        print("\n👋 Interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
