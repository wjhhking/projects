# 🎮 GameBit - 1 Sentence to a Game

*Note: This README is in Chinese, but the game interface and content are in English.*

一个基于 Next.js 的 8-bit 风格游戏生成器，只需要一句话就能生成完整的横版卷轴平台游戏！

## 🎯 核心功能

### 主要特性
- 🎮 **精选游戏**: 预置经典游戏 (超级马里奥、魂斗罗、雷电)
- 📝 **自定义游戏生成**: 用一句话描述你的游戏创意
- 🕹️ **8-bit 像素风格**: 经典复古视觉效果与自定义精灵系统
- 🏃 **横版卷轴平台**: 马里奥风格的游戏机制
- ⌨️ **简单控制**: 方向键 + 空格/Z/X 键操作
- 🏆 **多重关卡**: 每个游戏包含 8 个渐进式挑战关卡
- 💾 **保存系统**: 保存并重玩你的自定义游戏

### 游戏机制
- **玩家角色**: 8-bit 像素马里奥风格角色，支持动画
- **物理引擎**: 重力系统、跳跃机制、碰撞检测
- **平台系统**: 地面平台和悬浮砖块平台
- **敌人AI**: Goomba 风格敌人，支持踩踏击败
- **收集品**: 动画金币精灵和计分系统
- **关卡进度**: 基于旗帜的关卡完成机制

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 运行开发服务器
```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 开始游戏！

## 🎮 游戏控制

| 按键 | 功能 |
|------|------|
| ←→ 方向键 / A/D | 左右移动 |
| ↑ 方向键 / Space / W | 跳跃 |
| Z | 动作 A (攻击/互动) |
| X | 动作 B (速度提升切换) |
| R | 重新开始 (游戏结束时) |

## 🎯 如何使用

### 精选游戏
1. 在主页选择预置游戏：
   - **超级马里奥**: 经典平台跳跃，包含 Goomba 敌人和金币
   - **魂斗罗**: 横版射击游戏 (开发中)
   - **雷电**: 水平飞行射击游戏 (开发中)

2. 点击 "Play Now" 立即开始游戏

### 自定义游戏
1. 用英文描述你的游戏，例如：
   - "A fast hero jumps over dangerous enemies to collect golden coins"
   - "The brave warrior runs through a challenging castle"

2. 点击 "Generate Game" 按钮

3. 点击 "Start Game" 开始游戏

4. 使用键盘控制完成所有 8 个关卡！

## 🛠️ 技术栈

- **Next.js 14** - React 框架，使用 App Router
- **TypeScript** - 类型安全和更好的开发体验
- **Canvas API** - 游戏渲染和像素完美图形
- **自定义精灵系统** - 8-bit 风格像素艺术渲染
- **CSS3** - 现代响应式 UI 与像素化游戏画布

## 📁 项目结构

```
gamebit/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles and responsive design
│   ├── layout.tsx         # Root layout with metadata
│   ├── page.tsx           # Home page with featured games
│   ├── game/
│   │   └── page.tsx       # Game playing page
│   └── my-games/
│       └── page.tsx       # Saved games management
├── components/            # React components
│   └── GameCanvas.tsx     # Game canvas with controls
├── lib/                   # Game engine and logic
│   ├── audio.ts          # Audio management system
│   ├── game-engine.ts    # Core game engine base class
│   ├── player.ts         # Player character with physics
│   ├── sprites.ts        # Pixel sprite rendering system
│   └── games/            # Game implementations
│       ├── base-game.ts  # Abstract base game class
│       └── mario-game.ts # Mario-style platformer
└── package.json          # Project dependencies
```

## 🎨 核心特色

### 智能内容生成
根据输入句子的关键词动态调整游戏参数：
- `fast/quick/speed` → 角色移动速度提升至 300px/s
- `jump/fly/high` → 跳跃力增强至 500px/s
- `hard/difficult/challenge` → 敌人移动速度提升 1.5 倍
- `coin/gold/treasure` → 关卡中显示更多金币收集品

### 8-bit 视觉风格
- 像素完美渲染 (`image-rendering: pixelated`)
- 自定义精灵系统，支持像素艺术
- 经典马里奥风格角色和敌人动画
- 复古调色板和砖块纹理效果

### 完整游戏机制
- **物理引擎**: 重力系统、碰撞检测、平台判定
- **角色系统**: 动画状态、面向控制、死亡重生
- **敌人AI**: Goomba 风格敌人，可踩踏击败
- **关卡系统**: 8 个渐进式难度关卡，旗帜终点
- **计分系统**: 金币收集、敌人击败积分

## 🚀 部署

### 构建生产版本
```bash
npm run build
```

### 启动生产服务器
```bash
npm start
```

## 🎨 技术实现

### 已实现功能
- **自定义精灵系统** - 像素艺术渲染和动画管理
- **游戏引擎架构** - 基于 Canvas 的 2D 游戏引擎
- **响应式 UI** - 现代 Web 界面与像素游戏的完美结合
- **本地存储** - 游戏保存和管理系统

### 核心算法
- **物理引擎** - 重力、碰撞检测、平台交互
- **相机系统** - 平滑跟随玩家的视角控制
- **状态管理** - 游戏状态、关卡进度、分数系统
- **输入处理** - 键盘事件和游戏控制映射

## 📋 开发路线图

### 已完成 ✅
- [x] 基础游戏引擎和物理系统
- [x] 马里奥风格平台跳跃游戏
- [x] 自定义精灵渲染系统
- [x] 句子解析和游戏参数调整
- [x] 游戏保存和管理功能
- [x] 响应式 UI 设计

### 计划中 🚧
- [ ] Contra 风格射击游戏实现
- [ ] Raiden 风格飞行射击游戏
- [ ] 音效系统 (Web Audio API)
- [ ] 更多敌人类型和 Boss 战
- [ ] 关卡编辑器
- [ ] 游戏分享和导出功能
- [ ] AI 增强的句子解析

---

🎮 享受你的 8-bit 游戏创作之旅！