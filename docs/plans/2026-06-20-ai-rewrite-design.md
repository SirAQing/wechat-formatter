# AI 文章改写功能 — 设计文档

日期：2026-06-20

## 目标

在 Markdown 排版之前，通过 AI API 对草稿内容进行不同风格的改写，再将改写结果送入排版→同步流程。

## 架构

```
草稿输入 → AI 改写（风格+自定义prompt） → 改写结果（可编辑） → 排版 Tab → mdToHtml → 一键同步
```

两 Tab 结构：**改写 Tab**（草稿→AI→结果）+ **排版 Tab**（Markdown→预览→同步）。改写结果通过变量桥接到排版 Tab 的 textarea。

## UI 布局

```
┌──────────────────────────────────────┐
│  popup                    [⚡同步]   │
├────────────┬─────────────────────────┤
│ Tab: 改写  │  草稿输入（textarea）    │
│ Tab: 排版  │  风格选择 + 自定义prompt │
│            │  [🤖 AI 改写]           │
│            │  改写结果（可编辑）       │
│            │  [🔄重新] [→发送到排版]  │
└────────────┴─────────────────────────┘
```

## 风格预设（6 种 + 自定义）

| 风格 | System Prompt 方向 |
|------|-------------------|
| 花叔叙事 | 个人经历 + 技术干货 + 轻营销，第一人称叙事 |
| 技术干货 | 简洁直接，去掉叙事，只讲技术，主动语态 |
| 学术严谨 | 结构化，引用规范，避免口语，客观中性 |
| 技术博客 | Anthropic/Vercel 风，冷静克制，短段落 |
| 小红书图文 | 短句、emoji、口语化、段落拆碎 |
| 纯润色 | 不改风格，只优化表达和逻辑流畅度 |
| 自定义 | 用户自填 system prompt |

## API 配置

- Base URL：默认 `https://api.deepseek.com/v1`，可自定义（兼容 OpenAI 格式）
- API Key：用户自填，存储于 `chrome.storage.local`
- Model：默认 `deepseek-chat`，可切换
- 存储安全：`chrome.storage.local` 不落明文到磁盘，仅 Extension 作用域可读

## 数据流

1. 用户输入草稿 → 选择风格 → 点击 AI 改写
2. popup.js 读取 `chrome.storage.local` 获取 API 配置
3. 调用 fetch() 到兼容 OpenAI 格式的 API endpoint
4. 流式或非流式返回改写结果
5. 结果填入可编辑 textarea
6. 用户点击「发送到排版」→ 结果写入排版 Tab 的 textarea → 自动切换 Tab

## 交互状态

- **loading**：按钮 disabled + spinner + 文案「改写中...」
- **success**：按钮恢复，结果区显示内容
- **error**：结果区显示具体错误（未配置 Key / 401 / 429 / 5xx / 网络异常 / 空响应），不弹窗
- **重新改写**：用相同输入再请求一次
- **可编辑**：结果在 textarea 中，用户可手动微调

## 实现范围

- 改动文件：`popup.html`、`popup.js`
- 不改文件：`manifest.json`（权限已够）、`wechat-formatter.html`（独立版不加 AI）、`mdToHtml()` 解析器、`injectIntoWechatEditor()` 注入引擎

## 实现阶段

| 阶段 | 内容 | 说明 |
|------|------|------|
| P0 | API 配置 + 风格预设 + AI 调用 + 改写结果区 + loading/error | 核心功能 |
| P1 | Tab 切换结构 + 数据桥接到排版 Tab | 联动 |
| P2 | 重新改写 + 结果复制 + 自定义 prompt 展开 | 微调 |
