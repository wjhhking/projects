import { CompositionPlan } from './types'

export const snakePlan: CompositionPlan = {
  planVersion: '1.0',
  title: 'Snake',
  targetRuntime: 'phaser',
  templates: [
    { id: 'mt.grid.world', params: { tileSize: 16, width: 20, height: 20, stepHz: 8 } },
    { id: 'mt.control.orthogonalStep', params: { stepPerSecond: 8, allowReverse: false } },
    { id: 'mt.actor.snakeBody', params: { startLength: 3, growPerFood: 1 } },
    { id: 'mt.spawn.foodUniform', params: { spawnEverySteps: 1, maxFood: 1 } },
    { id: 'mt.rules.growthOnEat', params: { scorePerFood: 10 } },
    { id: 'mt.ui.hudBasic', params: { showLives: false, showTime: false, font: 'PressStart2P' } }
  ],
  assets: {
    sprites: {
      snake: { src: '/sprites/snake.png' },
      food: { src: '/sprites/food.png' }
    }
  },
  controls: {
    scheme: 'keyboard',
    actions: {
      moveUp: 'ArrowUp',
      moveDown: 'ArrowDown',
      moveLeft: 'ArrowLeft',
      moveRight: 'ArrowRight'
    }
  },
  conflictPolicy: { strategy: 'priority', tieBreak: 'error', allowUnsafe: false }
}
