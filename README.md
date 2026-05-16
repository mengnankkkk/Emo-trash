# Emo-trash

一个用于粉碎负面情绪的本地桌面应用。

## 当前目标

MVP 阶段聚焦一个最小闭环：

1. 输入想丢掉的情绪内容
2. 长按触发粉碎仪式
3. 用 PixiJS 呈现基于文字透明区域裁剪的切片粉碎效果
4. 在主进程中把抽象花朵结果写入本地 SQLite
5. 在底部花园展示释放后的留存结果，并让新增花朵有破土与轻微摇曳动画
6. 正式完成六类情绪标签、花朵皮肤和视觉映射
7. 用 Electron 真窗口 E2E 验证开发阶段主链路

## 技术栈

- Electron
- electron-vite
- React + TypeScript
- Tailwind CSS
- PixiJS
- better-sqlite3
- Playwright Electron E2E

## 本地开发

```bash
npm install
npm run dev
```

## AI 情绪识别配置

现在支持通过 OpenAI 格式兼容模型做情绪识别、强度判断、触发场景提取和引导式提问。

启动前可配置：

```bash
EMO_TRASH_OPENAI_API_KEY=your_api_key
EMO_TRASH_OPENAI_MODEL=your-model-name
EMO_TRASH_OPENAI_BASE_URL=https://your-openai-compatible-endpoint/v1
```

- `EMO_TRASH_OPENAI_BASE_URL` 可选，用于兼容 OpenAI API 格式的第三方模型服务。
- 未配置这些变量时，会自动回退到内置规则识别，不影响主流程。
- 原始文本仍不会写入 SQLite，只保存识别后的元数据。
- 可以直接复制 `.env.example` 为 `.env` 或 `.env.local`，应用启动时会自动加载。

## 验证命令

```bash
npm run typecheck
npm run lint
npm run test:run
npm run build
npm run test:e2e
```

## 验证说明

- `test:run` 用于 hooks、服务和持久化契约测试
- `test:e2e` 使用 Playwright 的 Electron 模式启动真窗口，验证输入、长按、花园刷新、情绪标签、花朵皮肤、破土/摇曳状态和控制台错误
- 浏览器预览兼容层仍保留，但不再是这一阶段的主验证路径

## 目录说明

- `src/main`：主进程、SQLite、窗口效果、IPC
- `src/preload`：`contextBridge` 暴露的业务 API
- `src/renderer`：输入界面、PixiJS 仪式、花园展示
- `tests/e2e`：Electron 真窗口 E2E 和 renderer 专用 Vite 配置
- `.spec-workflow`：需求、设计和任务文档
- `.claude`：上下文摘要、操作日志、验证报告
