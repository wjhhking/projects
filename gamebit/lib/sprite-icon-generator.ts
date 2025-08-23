import { SpriteRenderer } from './sprites'
import { MARIO_SPRITES, GOOMBA_SPRITES } from './sprites/mario-sprites'
import { CONTRA_SPRITES } from './sprites/contra-sprites'
import { RAIDEN_SPRITES } from './sprites/raiden-sprites'
import { BATTLE_CITY_SPRITES } from './sprites/battle-city-sprites'
import { FLOORS_SPRITES } from './sprites/floors-sprites'
import { COIN_SPRITES } from './sprites/common-sprites'

export function generateSpriteIcon(spriteData: number[][], colors: string[], size: number = 48): string {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  canvas.width = size
  canvas.height = size
  
  const spriteRenderer = new SpriteRenderer()
  const imageData = spriteRenderer.createPixelSprite(spriteData, colors)
  
  const scale = size / Math.max(imageData.width, imageData.height)
  const offsetX = (size - imageData.width * scale) / 2
  const offsetY = (size - imageData.height * scale) / 2
  
  ctx.imageSmoothingEnabled = false
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')!
  tempCanvas.width = imageData.width
  tempCanvas.height = imageData.height
  tempCtx.putImageData(imageData, 0, 0)
  
  ctx.drawImage(
    tempCanvas,
    offsetX, offsetY,
    imageData.width * scale,
    imageData.height * scale
  )
  
  return canvas.toDataURL()
}

export const GAME_SPRITE_ICONS = {
  mario: () => generateSpriteIcon(MARIO_SPRITES.standing, MARIO_SPRITES.colors),
  contra: () => generateSpriteIcon(CONTRA_SPRITES.player_standing, CONTRA_SPRITES.colors),
  raiden: () => generateSpriteIcon(RAIDEN_SPRITES.player, RAIDEN_SPRITES.colors),
  'tank-battle': () => generateSpriteIcon(BATTLE_CITY_SPRITES.player_tank_up, BATTLE_CITY_SPRITES.colors),
  'hundred-floors': () => generateSpriteIcon(FLOORS_SPRITES.miner, FLOORS_SPRITES.colors),
  // 为剩余游戏添加临时图标，后续实现时会替换
  'gold-miner': () => generateSpriteIcon(MARIO_SPRITES.standing, MARIO_SPRITES.colors), // 临时使用Mario
  tetris: () => generateSpriteIcon(COIN_SPRITES.spinning, COIN_SPRITES.colors), // 临时使用硬币
  snake: () => generateSpriteIcon(GOOMBA_SPRITES.walking, GOOMBA_SPRITES.colors), // 临时使用Goomba
  'magic-tower': () => generateSpriteIcon(FLOORS_SPRITES.miner, FLOORS_SPRITES.colors) // 临时使用矿工
}
