# 🎮 GameBit - 一句话生成游戏

*注意：此 README 为中文版本，但游戏界面和内容为英文。*

基于 Next.js 的复古游戏生成器，只需一句话描述就能生成完整的 8-bit 风格游戏！

## 🎯 核心功能

### 双引擎架构
- 🧩 **组合引擎**: 使用元模板和 JSON 配置声明式创建游戏
- 🎮 **经典引擎**: 传统面向对象游戏 (马里奥、魂斗罗、雷电、坦克大战、百层塔)
- 📝 **一句话生成**: 描述游戏创意，自动生成完整游戏
- 🕹️ **8-bit 像素风格**: 正宗复古视觉效果与自定义精灵系统
- 🏃 **多种游戏类型**: 平台跳跃、射击、解谜等多种游戏类型
- ⌨️ **简单控制**: 方向键 + 空格/Z/X 键操作所有游戏
- 🏆 **渐进关卡**: 每个游戏包含多个挑战关卡
- 💾 **保存系统**: 保存并重玩你的自定义游戏

### 游戏机制
- **玩家角色**: 8-bit 像素艺术，支持流畅动画
- **物理引擎**: 重力系统、碰撞检测、平台机制
- **敌人AI**: 多种敌人类型，具有不同行为模式
- **收集品**: 动画金币、道具和计分系统
- **关卡进度**: 基于旗帜的关卡完成和推进机制

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 运行开发服务器
```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 开始创建游戏！

## 🎮 游戏控制

| 按键 | 功能 |
|------|------|
| ←→ 方向键 / A/D | 左右移动 |
| ↑ 方向键 / Space / W | 跳跃 |
| Z | 动作 A (攻击/互动) |
| X | 动作 B (特殊能力) |
| R | 重新开始 (游戏结束时) |

## 🎯 如何使用

### 游戏生成
1. **用英文描述你的游戏**，例如：
   - "A brave soldier runs through enemy territory shooting aliens and avoiding deadly bullets"
   - "Fast spaceship flies through asteroid field shooting alien enemies"
   - "Ninja warrior runs across rooftops avoiding traps and collecting stars"

2. 点击 **"Generate Game"** 创建你的组合计划

3. 查看生成的元模板和参数配置

4. 点击 **"Generate & Play"** 开始你的自定义游戏

### 精选经典游戏
- **马里奥**: 经典平台跳跃，包含 Goomba 敌人和金币收集
- **魂斗罗**: 横版射击游戏，多种武器和敌人类型
- **雷电**: 纵向卷轴太空射击游戏
- **坦克大战**: 坦克对战，可破坏地形
- **百层塔**: 解谜平台游戏，垂直进度挑战

## 🛠️ 技术栈

- **Next.js 14** - React 框架，使用 App Router
- **TypeScript** - 类型安全和更好的开发体验
- **Canvas API** - 游戏渲染和像素完美图形
- **Phaser 3** - 组合式游戏的游戏引擎
- **自定义精灵系统** - 8-bit 风格像素艺术渲染
- **CSS3** - 现代响应式 UI 与像素化游戏画布

## 📁 项目结构

```
gamebit/
├── app/                      # Next.js App Router
│   ├── globals.css          # 全局样式和响应式设计
│   ├── layout.tsx           # 根布局和元数据
│   ├── page.tsx             # 主页和游戏生成器
│   ├── create/              # 统一游戏创建流程
│   ├── play_game/           # 游戏游玩界面
│   ├── my-games/            # 已保存游戏管理
│   └── public-games/        # 公共游戏画廊
├── components/              # React 组件
│   ├── GameCanvas.tsx       # 传统游戏画布
│   ├── PhaserPreview.tsx    # 基于 Phaser 的游戏预览
│   └── CompositionPreview.tsx # 组合系统预览
├── lib/                     # 游戏引擎和逻辑
│   ├── composition/         # 组合式游戏引擎
│   │   ├── inventory.ts     # 元模板定义
│   │   ├── builder.ts       # 游戏计划构建器
│   │   ├── types.ts         # 类型定义
│   │   └── validate.ts      # 计划验证
│   ├── games/              # 传统游戏实现
│   │   ├── base-game.ts    # 抽象基础游戏类
│   │   ├── mario-game.ts   # 马里奥风格平台游戏
│   │   ├── contra-game.ts  # 横版射击游戏
│   │   ├── raiden-game.ts  # 纵向太空射击游戏
│   │   ├── battle-city-game.ts # 坦克对战游戏
│   │   └── hundred-floors-game.ts # 解谜平台游戏
│   ├── sprites/            # 像素艺术精灵系统
│   ├── audio.ts           # 音频管理
│   ├── game-engine.ts     # 核心游戏引擎基础
│   └── player.ts          # 玩家角色物理
└── package.json           # 项目依赖
```

## 🎨 核心特色

### 双引擎架构

#### 1. 组合引擎 (inventory.ts)
- **声明式**: 使用 JSON 配置构建游戏
- **元模板**: 46+ 个预定义游戏组件
- **分类**: 世界、移动、实体、目标、规则、生成、UI
- **事件系统**: 通过 emits/listens 实现模板通信
- **运行时**: 基于 Phaser 3 的执行环境

组合示例:
```json
{
  "templates": [
    { "id": "mt.grid.world", "params": { "width": 20, "height": 20 } },
    { "id": "mt.actor.snakeBody", "params": { "startLength": 3 } },
    { "id": "mt.spawn.foodUniform", "params": { "maxFood": 1 } }
  ]
}
```

#### 2. 传统引擎 (base-game.ts)
- **面向对象**: 基于类的游戏开发
- **直接控制**: 手动游戏循环、渲染、物理
- **优化**: 基于 Canvas 的渲染以获得性能
- **专业化**: 每种游戏类型的自定义逻辑

### 智能内容生成
根据输入关键词动态调整游戏参数：
- `fast/quick/speed` → 角色移动速度提升至 300px/s
- `jump/fly/high` → 跳跃力增强至 500px/s
- `hard/difficult/challenge` → 敌人移动速度提升 1.5 倍
- `coin/gold/treasure` → 关卡中显示更多收集品

### 8-bit 视觉风格
- 像素完美渲染 (`image-rendering: pixelated`)
- 自定义精灵系统，支持像素艺术
- 经典马里奥风格角色和敌人动画
- 复古调色板和砖块纹理效果

### 完整游戏机制
- **物理引擎**: 重力、碰撞检测、平台交互
- **角色系统**: 动画状态、方向控制、死亡重生
- **敌人AI**: 多种敌人类型，具有独特行为
- **关卡系统**: 渐进式难度，基于旗帜的完成
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

## 📋 开发路线图

### 已完成 ✅
- [x] 双游戏引擎架构 (组合式 + 传统式)
- [x] 元模板系统，包含 46+ 个组件
- [x] 经典游戏：马里奥、魂斗罗、雷电、坦克大战、百层塔
- [x] 自定义精灵渲染系统
- [x] 句子解析和游戏参数调整
- [x] Phaser 3 集成用于组合游戏
- [x] 游戏保存和管理功能
- [x] 响应式 UI 设计

### 进行中 🚧
- [ ] 增强的 AI 驱动句子解析
- [ ] 更多元模板类别和组件
- [ ] 高级敌人 AI 模式
- [ ] 组合游戏的关卡编辑器
- [ ] 多人游戏支持

### 计划中 🔮
- [ ] 音频系统集成 (Web Audio API)
- [ ] Boss 战斗模板
- [ ] 游戏分享和导出功能
- [ ] 可视化脚本界面
- [ ] 移动触控控制
- [ ] Steam 创意工坊风格的游戏分享

## 🎮 元模板类别

组合引擎包含以下模板类别：

- **世界**: 网格系统、物理、滚动、屏幕包装
- **移动**: 平台控制、正交步进、冲量机制
- **实体**: 蛇身体、俄罗斯方块、挡板、敌人编队
- **目标**: 消行、目标旗帜、成长机制
- **规则**: 计分系统、关卡进度、碰撞处理
- **生成**: 食物放置、敌人生成、物品分布
- **UI**: HUD 元素、分数显示、生命计数器
- **弹射物**: 子弹、弹跳球、激光系统

---

🎮 今天就开始你的 8-bit 游戏创作之旅！