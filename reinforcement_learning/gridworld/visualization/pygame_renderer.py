"""Pygame renderer for GridWorld visualization."""

import pygame
import pygame.freetype
import numpy as np
from typing import Optional
from beartype import beartype
from environment.gridworld import GridWorld, CellType, Position, Action, GameStatus
import os


class Colors:
    """Modern color constants for visualization."""
    WHITE = (255, 255, 255)
    BLACK = (33, 37, 41)
    GRAY = (108, 117, 125)
    RED = (220, 53, 69)
    GREEN = (40, 167, 69)
    BLUE = (0, 123, 255)
    YELLOW = (255, 193, 7)
    ORANGE = (253, 126, 20)
    PURPLE = (111, 66, 193)
    CYAN = (23, 162, 184)
    DARK_GREEN = (25, 135, 84)
    LIGHT_GRAY = (248, 249, 250)
    SHADOW = (0, 0, 0, 50)
    BACKGROUND = (248, 249, 250)
    PANEL_BG = (255, 255, 255)
    BORDER = (206, 212, 218)


class PygameRenderer:
    """Pygame-based renderer for GridWorld environment."""

    def __init__(
        self,
        gridworld: GridWorld,
        cell_size: int = 50,
        window_width: int = 800,
        window_height: int = 600
    ):
        self.gridworld = gridworld
        self.cell_size = cell_size
        self.window_width = window_width
        self.window_height = window_height

        # Calculate grid dimensions
        self.grid_width = gridworld.size * cell_size
        self.grid_height = gridworld.size * cell_size
        self.grid_offset_x = 20
        self.grid_offset_y = 20

        # Initialize pygame with better quality
        pygame.init()
        pygame.freetype.init()
        self.screen = pygame.display.set_mode((window_width, window_height), pygame.DOUBLEBUF)
        pygame.display.set_caption("GridWorld RL Environment")
        self.clock = pygame.time.Clock()

        # Load fonts for better typography using freetype
        try:
            font_path = pygame.font.get_default_font()
            self.font = pygame.freetype.Font(font_path, 18)
            self.small_font = pygame.freetype.Font(font_path, 15)
            self.bold_font = pygame.freetype.Font(font_path, 18)
            self.bold_font.strong = True
            self.title_font = pygame.freetype.Font(font_path, 22)
            self.title_font.strong = True
            self.status_font = pygame.freetype.Font(font_path, 24)
            self.status_font.strong = True
        except Exception:
            # Fallback to default pygame font if freetype fails
            self.font = pygame.font.Font(None, 20)
            self.small_font = pygame.font.Font(None, 16)
            self.bold_font = pygame.font.Font(None, 20)
            self.bold_font.set_bold(True)
            self.title_font = pygame.font.Font(None, 24)
            self.title_font.set_bold(True)
            self.status_font = pygame.font.Font(None, 26)
            self.status_font.set_bold(True)

        # Load trap image
        self.trap_image = None
        try:
            trap_path = os.path.join(os.path.dirname(__file__), '..', 'assets', 'trap.jpeg')
            if os.path.exists(trap_path):
                self.trap_image = pygame.image.load(trap_path)
                self.trap_image = pygame.transform.smoothscale(self.trap_image, (cell_size - 10, cell_size - 10))
        except Exception as e:
            print(f"Could not load trap image: {e}")

        # Modern cell type colors with gradients
        self.cell_colors = {
            CellType.EMPTY: Colors.WHITE,
            CellType.OBSTACLE: Colors.BLACK,
            CellType.GOAL: Colors.GREEN,
            CellType.TRAP: Colors.RED,
            CellType.JUMP_PAD: Colors.CYAN
        }

        # Value function visualization
        self.show_values = False
        self.values: Optional[np.ndarray] = None
        self.show_policy = False
        self.policy: Optional[np.ndarray] = None
        self.jump_mode = False

    @beartype
    def set_values(self, values: np.ndarray | None) -> None:
        """Set value function for heatmap visualization."""
        self.values = values
        self.show_values = values is not None

    @beartype
    def set_policy(self, policy: np.ndarray | None) -> None:
        """Set policy for arrow visualization."""
        self.policy = policy
        self.show_policy = policy is not None

    def set_jump_mode(self, enabled: bool):
        """Enable or disable jump mode visualization."""
        self.jump_mode = enabled

    @beartype
    def _get_cell_rect(self, row: int, col: int) -> pygame.Rect:
        """Get rectangle for grid cell."""
        x = self.grid_offset_x + col * self.cell_size
        y = self.grid_offset_y + row * self.cell_size
        return pygame.Rect(x, y, self.cell_size, self.cell_size)

    def _draw_rounded_rect(self, surface, color, rect, radius=5):
        """Draw a rounded rectangle."""
        pygame.draw.rect(surface, color, rect, border_radius=radius)

    def _draw_shadow(self, surface, rect, offset=2):
        """Draw a subtle shadow effect."""
        shadow_rect = rect.copy()
        shadow_rect.x += offset
        shadow_rect.y += offset
        shadow_surface = pygame.Surface((shadow_rect.width, shadow_rect.height), pygame.SRCALPHA)
        pygame.draw.rect(shadow_surface, Colors.SHADOW, (0, 0, shadow_rect.width, shadow_rect.height), border_radius=5)
        surface.blit(shadow_surface, shadow_rect)

    def _render_text(self, font, text: str, color: tuple[int, int, int]):
        """Render text using freetype if available, otherwise fallback to default."""
        if isinstance(font, pygame.freetype.Font):
            return font.render(text, fgcolor=color)
        else:
            # Fallback for standard font
            surface = font.render(text, True, color)
            return surface, surface.get_rect()

    def _draw_grid_labels(self):
        """Draw labels for start and goal positions."""
        # Draw start label
        if hasattr(self.gridworld, 'start_pos') and self.gridworld.start_pos:
            rect = self._get_cell_rect(self.gridworld.start_pos.row, self.gridworld.start_pos.col)
            text_surf, text_rect = self._render_text(self.small_font, "Start", Colors.BLACK)
            text_rect.center = rect.center
            self.screen.blit(text_surf, text_rect)

        # Goal label is now drawn directly in _draw_grid for better alignment.


    @beartype
    def _draw_grid(self) -> None:
        """Draw the grid with cell types."""
        for row in range(self.gridworld.size):
            for col in range(self.gridworld.size):
                rect = self._get_cell_rect(row, col)
                cell_type = self.gridworld.grid[row, col]

                # Draw shadow first
                if cell_type != CellType.EMPTY:
                    self._draw_shadow(self.screen, rect)

                # Draw cell background with modern styling
                if self.show_values and self.values is not None:
                    # Color based on value function
                    state = self.gridworld.position_to_state(Position(row, col))
                    value = self.values[state]

                    # Normalize value to color intensity
                    if np.max(self.values) > np.min(self.values):
                        normalized = (value - np.min(self.values)) / (np.max(self.values) - np.min(self.values))
                    else:
                        normalized = 0.5

                    # Create modern heatmap color (blue to red with better gradients)
                    intensity = int(255 * normalized)
                    color = (255 - intensity//2, intensity//4, intensity)
                    self._draw_rounded_rect(self.screen, color, rect)
                else:
                    # Use default cell type color with rounded corners
                    color = self.cell_colors[cell_type]
                    self._draw_rounded_rect(self.screen, color, rect)

                # Draw modern cell border
                pygame.draw.rect(self.screen, Colors.BORDER, rect, 2, border_radius=5)

                # Draw cell type symbols
                center_x = rect.centerx
                center_y = rect.centery

                if cell_type == CellType.OBSTACLE:
                    # Modern obstacle with gradient effect
                    self._draw_rounded_rect(self.screen, Colors.BLACK, rect)
                    # Add subtle highlight
                    highlight_rect = pygame.Rect(rect.x + 2, rect.y + 2, rect.width - 4, rect.height // 3)
                    pygame.draw.rect(self.screen, (60, 60, 60), highlight_rect, border_radius=3)

                elif cell_type == CellType.GOAL:
                    # Simplified text-based goal representation
                    line1_surf, line1_rect = self._render_text(self.bold_font, "Goal", Colors.BLACK)
                    line2_surf, line2_rect = self._render_text(self.font, f"+{self.gridworld.goal_reward}", Colors.BLACK)

                    line1_rect.center = (center_x, center_y - line1_rect.height / 2)
                    line2_rect.center = (center_x, center_y + line2_rect.height / 2)

                    self.screen.blit(line1_surf, line1_rect)
                    self.screen.blit(line2_surf, line2_rect)

                elif cell_type == CellType.TRAP:
                    # Use image if available, otherwise draw modern X
                    if self.trap_image:
                        img_rect = self.trap_image.get_rect(center=(center_x, center_y))
                        self.screen.blit(self.trap_image, img_rect)
                    else:
                        # Modern X with anti-aliasing effect
                        line_width = 4
                        pygame.draw.line(self.screen, Colors.BLACK,
                                       (center_x - self.cell_size//3, center_y - self.cell_size//3),
                                       (center_x + self.cell_size//3, center_y + self.cell_size//3), line_width)
                        pygame.draw.line(self.screen, Colors.BLACK,
                                       (center_x + self.cell_size//3, center_y - self.cell_size//3),
                                       (center_x - self.cell_size//3, center_y + self.cell_size//3), line_width)
                        # Add red outline for danger
                        pygame.draw.line(self.screen, Colors.RED,
                                       (center_x - self.cell_size//3, center_y - self.cell_size//3),
                                       (center_x + self.cell_size//3, center_y + self.cell_size//3), 2)
                        pygame.draw.line(self.screen, Colors.RED,
                                       (center_x + self.cell_size//3, center_y - self.cell_size//3),
                                       (center_x - self.cell_size//3, center_y + self.cell_size//3), 2)
                elif cell_type == CellType.JUMP_PAD:
                    # Simplified text-based jump pad representation
                    line1_surf, line1_rect = self._render_text(self.bold_font, "JUMP", Colors.BLACK)
                    line2_surf, line2_rect = self._render_text(self.font, f"({row},{col})", Colors.BLACK)

                    line1_rect.center = (center_x, center_y - line1_rect.height / 2)
                    line2_rect.center = (center_x, center_y + line2_rect.height / 2)

                    self.screen.blit(line1_surf, line1_rect)
                    self.screen.blit(line2_surf, line2_rect)

        self._draw_grid_labels()

    @beartype
    def _draw_agent(self) -> None:
        """Draw the agent."""
        row, col = self.gridworld.agent_pos.row, self.gridworld.agent_pos.col
        rect = self._get_cell_rect(row, col)
        center = rect.center

        # Draw modern agent with gradient effect
        agent_color = Colors.ORANGE if self.gridworld.has_jump else Colors.BLUE

        # Draw shadow
        shadow_center = (center[0] + 2, center[1] + 2)
        pygame.draw.circle(self.screen, Colors.SHADOW, shadow_center, self.cell_size // 3)

        # Draw main agent circle
        pygame.draw.circle(self.screen, agent_color, center, self.cell_size // 3)

        # Add highlight for 3D effect
        highlight_center = (center[0] - self.cell_size // 8, center[1] - self.cell_size // 8)
        pygame.draw.circle(self.screen, (255, 255, 255, 100), highlight_center, self.cell_size // 6)

        # Draw border
        pygame.draw.circle(self.screen, Colors.BLACK, center, self.cell_size // 3, 3)

        # Draw jump indicator with better styling
        if self.gridworld.has_jump:
            # Create pulsing effect background
            pulse_surface = pygame.Surface((self.cell_size, self.cell_size), pygame.SRCALPHA)
            pygame.draw.circle(pulse_surface, (*Colors.YELLOW, 80),
                             (self.cell_size // 2, self.cell_size // 2), self.cell_size // 2)
            self.screen.blit(pulse_surface, (rect.x, rect.y))

            text_surf, text_rect = self._render_text(self.font, "⚡", Colors.YELLOW)
            text_rect.center = (center[0], center[1] - self.cell_size // 4)
            self.screen.blit(text_surf, text_rect)

    def _draw_jump_preview(self):
        """Highlight potential landing spots in jump mode."""
        if not self.jump_mode:
            return

        agent_pos = self.gridworld.agent_pos
        agent_center = self._get_cell_rect(agent_pos.row, agent_pos.col).center

        for action in Action:
            dr, dc = self.gridworld.action_deltas[action]
            jump_pos = Position(agent_pos.row + dr * 2, agent_pos.col + dc * 2)

            if self.gridworld._is_walkable(jump_pos):
                rect = self._get_cell_rect(jump_pos.row, jump_pos.col)

                # Draw a semi-transparent yellow circle as a marker
                surface = pygame.Surface((self.cell_size, self.cell_size), pygame.SRCALPHA)
                pygame.draw.circle(surface, (*Colors.YELLOW, 128), (self.cell_size // 2, self.cell_size // 2), self.cell_size // 3)
                self.screen.blit(surface, (rect.x, rect.y))

                # Draw an arrow from agent to the preview
                pygame.draw.line(self.screen, Colors.ORANGE, agent_center, rect.center, 2)

    @beartype
    def _draw_policy_arrows(self) -> None:
        """Draw policy arrows if policy is set."""
        if not self.show_policy or self.policy is None:
            return

        arrow_vectors = {
            Action.UP: (0, -1),
            Action.DOWN: (0, 1),
            Action.LEFT: (-1, 0),
            Action.RIGHT: (1, 0)
        }

        for row in range(self.gridworld.size):
            for col in range(self.gridworld.size):
                pos = Position(row, col)
                if self.gridworld.grid[row, col] == CellType.OBSTACLE:
                    continue

                state = self.gridworld.position_to_state(pos)
                action = Action(self.policy[state])

                rect = self._get_cell_rect(row, col)
                center = rect.center

                # Draw arrow
                dx, dy = arrow_vectors[action]
                arrow_length = self.cell_size // 4
                end_x = center[0] + dx * arrow_length
                end_y = center[1] + dy * arrow_length

                pygame.draw.line(self.screen, Colors.BLACK, center, (end_x, end_y), 2)

                # Draw arrowhead
                head_size = 5
                if dx != 0:  # Horizontal arrow
                    pygame.draw.polygon(self.screen, Colors.BLACK, [
                        (end_x, end_y),
                        (end_x - dx * head_size, end_y - head_size),
                        (end_x - dx * head_size, end_y + head_size)
                    ])
                else:  # Vertical arrow
                    pygame.draw.polygon(self.screen, Colors.BLACK, [
                        (end_x, end_y),
                        (end_x - head_size, end_y - dy * head_size),
                        (end_x + head_size, end_y - dy * head_size)
                    ])

    @beartype
    def _draw_info_panel(self) -> None:
        """Draw information panel."""
        panel_x = self.grid_offset_x + self.grid_width + 20
        panel_y = self.grid_offset_y

        # Game Status section
        y_offset = 10

        # Bold header with modern styling
        header_surf, _ = self._render_text(self.bold_font, "🎮 Game Status", Colors.BLACK)
        self.screen.blit(header_surf, (panel_x, panel_y + y_offset))
        y_offset += 35

        # Status details
        status = self.gridworld.status
        status_text = f"Status: {status.name.capitalize()}"
        status_color = Colors.GREEN if status == GameStatus.RUNNING else Colors.ORANGE

        status_lines = [
            (status_text, status_color),
            (f"Score: {self.gridworld.total_reward:.1f}", Colors.BLUE),
            (f"Position: ({self.gridworld.agent_pos.row},{self.gridworld.agent_pos.col})", Colors.BLUE),
            (f"Episode Steps: {self.gridworld.episode_steps}", Colors.BLACK),
        ]

        for text, color in status_lines:
            text_surf, _ = self._render_text(self.small_font, text, color)
            self.screen.blit(text_surf, (panel_x, panel_y + y_offset))
            y_offset += 20

        y_offset += 10

        # Rules & Rewards section
        header_surf, _ = self._render_text(self.bold_font, "Rules & Rewards", Colors.BLACK)
        self.screen.blit(header_surf, (panel_x, panel_y + y_offset))
        y_offset += 30

        rules_lines = [
            f"Goal: +{self.gridworld.goal_reward}",
            f"Trap: {self.gridworld.trap_penalty}",
            f"Step: {self.gridworld.step_penalty}",
            f"Wall: {self.gridworld.wall_penalty}"
        ]

        for line in rules_lines:
            text_surf, _ = self._render_text(self.small_font, line, Colors.BLACK)
            self.screen.blit(text_surf, (panel_x, panel_y + y_offset))
            y_offset += 20

        y_offset += 10

        # Controls section
        header_surf, _ = self._render_text(self.bold_font, "Controls", Colors.BLACK)
        self.screen.blit(header_surf, (panel_x, panel_y + y_offset))
        y_offset += 30

        control_lines = [
            "Arrow Keys: Move",
            "Space: Use Jump",
            "R: Reset",
            "V: Toggle Values (Est. Reward)",
            "P: Toggle Policy (Best Action)",
            "ESC: Quit"
        ]

        for line in control_lines:
            text_surf, _ = self._render_text(self.small_font, line, Colors.BLACK)
            self.screen.blit(text_surf, (panel_x, panel_y + y_offset))
            y_offset += 20

    def _draw_info_panel_background(self):
        """Draw modern info panel background."""
        panel_x = self.grid_offset_x + self.grid_width + 20
        panel_y = self.grid_offset_y
        panel_width = self.window_width - panel_x - 20
        panel_height = self.window_height - panel_y - 20

        panel_rect = pygame.Rect(panel_x - 10, panel_y - 10, panel_width, panel_height)

        # Draw shadow
        shadow_rect = panel_rect.copy()
        shadow_rect.x += 3
        shadow_rect.y += 3
        shadow_surface = pygame.Surface((shadow_rect.width, shadow_rect.height), pygame.SRCALPHA)
        pygame.draw.rect(shadow_surface, Colors.SHADOW, (0, 0, shadow_rect.width, shadow_rect.height), border_radius=10)
        self.screen.blit(shadow_surface, shadow_rect)

        # Draw panel background
        pygame.draw.rect(self.screen, Colors.PANEL_BG, panel_rect, border_radius=10)
        pygame.draw.rect(self.screen, Colors.BORDER, panel_rect, 2, border_radius=10)

    @beartype
    def animate_episode(self, trajectory: list[tuple[Position, Action, float]], speed: float = 5.0) -> None:
        """Animate a full episode trajectory."""
        if not trajectory:
            return

        clock = pygame.time.Clock()
        original_agent_pos = self.gridworld.agent_pos

        for i, (pos, action, reward) in enumerate(trajectory):
            self.gridworld.agent_pos = pos
            self.render()

            # Draw trajectory line
            if i > 0:
                start_rect = self._get_cell_rect(trajectory[i-1][0].row, trajectory[i-1][0].col)
                end_rect = self._get_cell_rect(pos.row, pos.col)
                pygame.draw.line(self.screen, Colors.ORANGE, start_rect.center, end_rect.center, 3)

            pygame.display.flip()
            clock.tick(speed)

        self.gridworld.agent_pos = original_agent_pos

    @beartype
    def render(self) -> None:
        """Render the current state with modern styling."""
        self.screen.fill(Colors.BACKGROUND)

        # Draw title
        title_surf, title_rect = self._render_text(self.title_font, "GridWorld RL Environment", Colors.BLACK)
        title_rect.center = (self.window_width // 2, 30)
        self.screen.blit(title_surf, title_rect)

        self._draw_info_panel_background()
        self._draw_grid()
        self._draw_policy_arrows()
        self._draw_agent()
        self._draw_jump_preview()
        self._draw_info_panel()

        pygame.display.flip()

    @beartype
    def handle_events(self) -> dict[str, bool]:
        """Handle pygame events and return action flags."""
        events = {
            "quit": False,
            "reset": False,
            "move_up": False,
            "move_down": False,
            "move_left": False,
            "move_right": False,
            "use_jump": False,
            "toggle_values": False,
            "toggle_policy": False
        }

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                events["quit"] = True
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    events["quit"] = True
                elif event.key == pygame.K_r:
                    events["reset"] = True

                # Handle keys only if game is running
                if self.gridworld.status == GameStatus.RUNNING:
                    if event.key == pygame.K_UP:
                        events["move_up"] = True
                    elif event.key == pygame.K_DOWN:
                        events["move_down"] = True
                    elif event.key == pygame.K_LEFT:
                        events["move_left"] = True
                    elif event.key == pygame.K_RIGHT:
                        events["move_right"] = True
                    elif event.key == pygame.K_SPACE:
                        events["use_jump"] = True

                if event.key == pygame.K_v:
                    events["toggle_values"] = True
                elif event.key == pygame.K_p:
                    events["toggle_policy"] = True

        return events

    @beartype
    def close(self) -> None:
        """Close the renderer."""
        pygame.quit()
