# 公众号排版助手

**解决什么问题：** 微信公众号编辑器的粘贴过滤机制会随机吃掉内联样式。直接粘贴 → 丢背景色/丢代码块/丢排版。本工具用 Chrome Extension 直接把格式化后的 HTML 注入编辑器 DOM，完全绕过粘贴过滤器。

## 核心功能

- **一键同步**：Chrome Extension 直注微信编辑器 DOM，不走剪贴板
- **Markdown → 富文本**：标题/正文/引用/代码块/列表，全内联样式
- **Anthropic-Tech 主题**：一套适配技术文章的暖陶色排版（34px 标题 / Mac Terminal 代码块 / 引用卡片）
- **纯前端零依赖**：独立 HTML 可离线使用，Extension popup 随手打开

## 快速开始

### 方式一：Chrome Extension（推荐）

1. Chrome → `chrome://extensions/` → 开启「开发者模式」
2. 「加载已解压的扩展程序」→ 选择项目目录
3. 打开 `mp.weixin.qq.com` 图文编辑页面
4. 点击扩展图标 → 写 Markdown → 点击「⚡ 一键同步」

### 方式二：独立页面

浏览器直接打开 `wechat-formatter.html` → 编辑 → 复制 → 粘贴到公众号编辑器

## 目录结构

```
├── manifest.json              # Chrome Extension (MV3)
├── popup.html / popup.js      # 扩展弹窗排版界面
├── icon.svg                   # 扩展图标
├── wechat-formatter.html      # 独立版（浏览器直接打开）
└── README.md
```

## 公众号兼容性设计

全部使用微信白名单 HTML 标签：`section` `table` `p` `blockquote` `h1-h3`。
刻意避开的：`div` `pre` `max-width` `box-shadow` `overflow`。

## License

MIT
