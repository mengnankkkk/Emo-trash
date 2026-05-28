# Emo-trash

一个用于粉碎负面情绪的本地桌面应用。把想丢掉的情绪写下来，经过粉碎仪式后，它会变成花园里的一朵花。原文不会被保存，只留下抽象的情绪痕迹。

## 核心玩法

1. 在「情绪垃圾桶」里输入想扔掉的内容
2. AI 或规则引擎自动识别情绪类型、强度、触发场景，并给出温和追问
3. 长按底部按钮触发粉碎仪式（随机特效：爆散 / 坠落 / 故障 / 灰化 / 漩涡 / 溶解）
4. 原文坍缩，花园里长出一朵新花，附带稀有度判定
5. 持续释放、浇水、收集，解锁成就和称号

## 功能模块

### 释放（Release）

- 文本输入 + 实时 AI 情绪识别（支持 OpenAI 兼容接口，未配置时自动回退规则引擎）
- 六类情绪标签：愤怒、崩溃、焦虑、疲惫、平静、释然
- 三级强度判定：轻微、中等、强烈
- 触发场景提取 + 引导式追问 + 建议标签
- 时间语境感知（凌晨 / 清晨 / 上午 / 中午 / 下午 / 晚上 / 深夜）
- PixiJS 粉碎仪式动画（6 种随机特效）
- 每日快捷记录入口（当天未释放时弹出）
- 释放后 Recap 卡片展示结果

### 花园（Garden）

- 像素风花朵，每种情绪对应独立花型和颜色
- 5 级成长阶段（种子 → 发芽 → 生长 → 开花 → 盛放）
- 浇水机制：每日 1 次手动浇水配额，释放时自动浇水
- 摘花机制：可移除不想保留的花朵
- 花园天气系统：根据当日主导情绪显示天气（雷暴 / 大风 / 暴雨 / 阴天 / 晴天 / 彩虹 / 多云）
- 季节主题：日历季节（春夏秋冬）× 花园季节（新芽季 / 开花季 / 盛放季）

### 花朵稀有度

每次释放时随机判定：

| 稀有度 | 概率 | 视觉效果 |
|--------|------|----------|
| 普通 | 85% | 默认样式 |
| 闪光 | 12% | 边缘微光 + 轻微脉动 |
| 星光 | 2.5% | 星星粒子环绕 + 彩虹光晕 |
| 传说 | 0.5% | 多色渐变 + 旋转光环 + 持续粒子特效 |

### 统计（Analytics）

- 7 日情绪释放趋势图
- 情绪分布占比
- 高峰释放时段
- 连续释放天数（当前 / 最长）
- 花园成长等级和进度

### 历史（History）

- 30 日情绪日历热力图
- 按日期查看情绪时间轴
- 按情绪类型筛选

### 成就（Achievements）

12 项成就，分 5 个类别：

- **里程碑**：首次释放、十朵起步、半百花园、百朵花园
- **连续**：连续三日、连续七日、连续两周
- **成长**：首次开花、首次盛放、三朵盛放
- **多样性**：情绪全谱（6 类情绪各释放过）
- **仪式**：细心园丁（累计 10 次手动浇水）

解锁时弹出 Toast 通知。

### 图鉴（FlowerDex）

6 种情绪 × 4 种稀有度 = 24 格收藏册，记录首次获得时间和累计数量。

### 称号（Titles）

7 个可解锁称号，解锁后显示在顶部 HUD：

- 夜猫子、早起鸟、情绪全能者、传说猎人、花园大师、坚持者、释放达人

## 技术栈

- **框架**：Electron 39 + electron-vite 5
- **前端**：React 19 + TypeScript 5.9 + Tailwind CSS 4
- **动画**：PixiJS 8（像素风花朵 + 粉碎特效）
- **数据库**：better-sqlite3（本地 SQLite，数据不离开设备）
- **校验**：Zod 4（全链路类型安全）
- **AI**：OpenAI SDK（兼容任意 OpenAI 格式接口）
- **测试**：Vitest 4（单元 / 集成）+ Playwright（Electron E2E）
- **代码质量**：ESLint 9 + Prettier

## 本地开发

```bash
npm install
npm run dev
```

## AI 情绪识别配置

支持通过 OpenAI 格式兼容模型做情绪识别。复制 `.env.example` 为 `.env` 或 `.env.local`：

```bash
EMO_TRASH_OPENAI_API_KEY=your_api_key
EMO_TRASH_OPENAI_MODEL=your-model-name
EMO_TRASH_OPENAI_BASE_URL=https://your-openai-compatible-endpoint/v1
```

- `EMO_TRASH_OPENAI_BASE_URL` 可选，用于兼容第三方模型服务
- 未配置时自动回退到内置规则引擎，不影响主流程
- 原始文本不会写入数据库，只保存识别后的元数据

## 构建

```bash
npm run build:win    # Windows (NSIS 安装包)
npm run build:mac    # macOS (DMG)
npm run build:linux  # Linux (AppImage / snap / deb)
```

## 验证命令

```bash
npm run typecheck    # 类型检查
npm run lint         # ESLint
npm run test:run     # Vitest 单元测试
npm run build        # 完整构建
npm run test:e2e     # Playwright Electron E2E
```

## 目录结构

```
src/
├── main/              主进程
│   ├── config/        环境变量加载
│   ├── db/            SQLite schema + repository
│   ├── ipc/           IPC handler 注册
│   ├── services/      AI 情绪分析、释放逻辑、窗口特效
│   └── windows/       窗口创建
├── preload/           contextBridge API 定义 + Zod schema
├── renderer/src/      渲染进程
│   ├── features/      按功能拆分的页面组件
│   │   ├── achievements/   成就页 + Toast
│   │   ├── analytics/      统计面板 + 趋势图
│   │   ├── capture/        输入框 + 每日快捷入口
│   │   ├── flowerdex/      花朵图鉴
│   │   ├── garden/         花园视图 + 成长面板 + 天气
│   │   ├── history/        热力图 + 时间轴 + 筛选栏
│   │   ├── recap/          释放结果卡片
│   │   └── ritual/         长按按钮 + PixiJS 粉碎画布
│   ├── hooks/         业务 hooks
│   ├── lib/           花朵资源 + 运行时 API 适配
│   └── types/         前端类型定义
├── shared/            前后端共享逻辑
│   ├── achievements.ts      成就系统
│   ├── emotionAnalysis.ts   情绪分析（规则引擎 + AI 结果构建）
│   ├── emotionInsights.ts   统计 / 成长 / 连续天数计算
│   ├── emotionMeta.ts       情绪定义 + 仪式特效定义
│   ├── emotionWeather.ts    天气系统
│   ├── flowerDex.ts         图鉴系统
│   ├── rarity.ts            稀有度判定
│   ├── seasonalTheme.ts     季节主题
│   └── titles.ts            称号系统
└── tests/             测试
    ├── e2e/           Playwright Electron E2E
    ├── main/          主进程单元测试
    └── renderer/      渲染进程组件测试
```

## 隐私

- 所有数据存储在本地 SQLite，不上传任何服务器
- 原始输入文本在释放后立即丢弃，数据库只保存情绪元数据
- AI 分析为可选功能，未配置时完全离线运行

## License

[AGPL-3.0](LICENSE)
