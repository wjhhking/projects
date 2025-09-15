"""Demo selection menu for GridWorld reinforcement learning demonstrations.

uv run -m demos.menu
"""

import sys
from beartype import beartype


@beartype
def show_menu() -> None:
    """Display the demo selection menu."""
    print("🎮 GridWorld RL Demos")
    print("=" * 30)
    print("1. Interactive Play Mode")
    print("2. Replay Recorded Episodes")
    print("3. Bellman Equation Explorer")
    print("4. Dynamic Programming Demo")
    print("5. Monte Carlo Demo")
    print("6. TD(0) Demo")
    print("7. Q-Learning Demo")
    print("8. REINFORCE Demo")
    print("0. Exit")
    print()


@beartype
def run_demo(choice: str) -> bool:
    """Run the selected demo. Returns True to continue, False to exit."""
    if choice == "1":
        print("🎮 Starting Interactive Play Mode...")
        from .play import main
        main()
    elif choice == "2":
        print("📼 Starting Replay System...")
        from .replay import main
        main()
    elif choice == "3":
        print("🔍 Starting Bellman Equation Explorer...")
        from .bellman_equation_demo import main
        main()
    elif choice == "4":
        print("🧮 Starting Dynamic Programming Demo...")
        from .dynamic_programming_demo import main
        main()
    elif choice == "5":
        print("🎯 Starting Monte Carlo Demo...")
        from .monte_carlo_demo import main
        main()
    elif choice == "6":
        print("⏰ Starting TD(0) Demo...")
        from .temporal_difference_demo import main
        main()
    elif choice == "7":
        print("🤖 Starting Q-Learning Demo...")
        from .q_learning_demo import main
        main()
    elif choice == "8":
        print("🧠 Starting REINFORCE Demo...")
        from .reinforce_demo import main
        main()
    elif choice == "0":
        print("👋 Goodbye!")
        return False
    else:
        print("❌ Invalid choice. Please try again.")

    return True


@beartype
def main() -> None:
    """Main demo menu loop."""
    try:
        while True:
            show_menu()
            choice = input("Select a demo (0-8): ").strip()
            print()

            if not run_demo(choice):
                break

            if choice in ["1", "2", "3", "4", "5", "6", "7", "8"]:
                input("\nPress Enter to return to menu...")
                print()

    except KeyboardInterrupt:
        print("\n👋 Interrupted by user")
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
