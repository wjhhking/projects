# 🎮 GameBit - 1 Sentence to a Game

*Note: This README is in Chinese, but the game interface and content are in English.*

一个基于 Next.js 的 8-bit 风格游戏生成器，只需要一句话就能生成一个完整的横版卷轴游戏！

## 🎯 MVP 计划

### 核心功能
- 🎮 **句子输入界面**: 用户输入一句英文描述
- 🕹️ **8-bit 像素风格**: 经典复古视觉效果
- 🏃 **横版卷轴游戏**: 类似超级玛丽的基础玩法
- ⌨️ **简单控制**: 方向键移动 + 空格跳跃
- 🏆 **固定关卡**: 10个向右滚动的关卡

### 游戏机制
- **玩家角色**: 8-bit 像素风格的小人
- **基础物理**: 重力、跳跃、左右移动
- **平台系统**: 地面和悬浮平台
- **敌人**: 简单的红色方块敌人
- **收集品**: 黄色金币
- **生命系统**: 3条生命

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
| ←→ 方向键 | 左右移动 |
| ↑ 方向键 / Space | 跳跃 |
| Z | 动作 A (预留) |
| X | 动作 B (加速) |

## 🎯 如何使用

1. 在输入框中用英文描述你想要的游戏，例如：
   - "A fast hero jumps over dangerous enemies to collect golden coins"
   - "The brave warrior runs through a challenging castle"

2. 点击 "Generate Game" 按钮

3. 点击 "Start Game" 开始游戏

4. 使用键盘控制角色完成关卡！

## 🛠️ 技术栈

- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **Canvas API** - 游戏渲染
- **NES.css** - 8-bit 风格 UI 组件库
- **CSS3** - 自定义像素化样式

## 📁 项目结构

```
gamebit/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # React 组件
│   └── GameCanvas.tsx     # 游戏画布组件
├── lib/                   # 游戏逻辑
│   ├── game-engine.ts    # 游戏引擎基类
│   ├── game.ts           # 主游戏类
│   └── player.ts         # 玩家类
└── package.json          # 项目配置
```

## 🎨 MVP 特色

### 智能内容生成 (简化版)
根据输入句子的关键词调整游戏参数：
- `fast/quick/speed` → 角色移动更快
- `jump/fly/high` → 跳跃力更强
- `hard/difficult/challenge` → 敌人移动更快
- `coin/gold/treasure` → 显示更多金币

### 8-bit 视觉风格
- 像素化渲染 (`image-rendering: pixelated`)
- 复古调色板 (绿色、红色、蓝色、黄色)
- Press Start 2P 字体
- 简单的方块图形

### 基础游戏机制
- **物理系统**: 重力和碰撞检测
- **平台跳跃**: 可以站在平台上
- **敌人AI**: 简单的左右移动
- **收集系统**: 碰到金币增加分数
- **生命系统**: 碰到敌人减少生命

## 🚀 部署

### 构建生产版本
```bash
npm run build
```

### 启动生产服务器
```bash
npm start
```

## 🎨 8-bit 资源库

### 已集成
- **NES.css** - 提供 NES 风格的 UI 组件 (按钮、输入框、容器等)

### 推荐资源 (可选)
- **Akihabara** - 专业 8-bit 游戏开发库
- **OpenGameArt.org** - 免费像素艺术精灵
- **itch.io** - 像素艺术资源包
- **Kenney.nl** - 高质量免费游戏素材

## 📋 TODO (未来版本)

- [ ] 音效系统 (Web Audio API)
- [ ] 集成更多像素艺术精灵
- [ ] 更复杂的句子解析
- [ ] 更多敌人类型和动画
- [ ] 关卡编辑器
- [ ] 分享功能

---

🎮 享受你的 8-bit 游戏创作之旅！