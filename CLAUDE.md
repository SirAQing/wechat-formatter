# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A Chrome Extension (MV3) for WeChat Official Account article formatting. Converts Markdown to WeChat-safe HTML and injects it directly into the WeChat editor DOM via `chrome.scripting.executeScript` — bypassing the platform's paste filter entirely. Also includes optional AI-powered article rewriting and smart formatting.

## Architecture

```
popup.html / popup.js  (Extension popup)
├── Tab: ✍️ 改写 (Rewrite)
│   ├── Style presets (6 + custom) → callAI() → OpenAI-compatible API
│   └── Smart Format → AI enhances article with template cards → HTML output
├── Tab: 🎨 排版 (Format)
│   ├── mdToHtml() parser → render() → preview
│   ├── copyToClipboard() → WeChat editor (clipboard fallback)
│   └── syncToWechat() → chrome.scripting.executeScript(injectIntoWechatEditor)
└── Tab: 📋 模板 (Templates)
    ├── 20 pre-built WeChat-safe HTML modules, 9 categories
    ├── "→排版" button: sets preview.innerHTML directly, bypasses Markdown
    └── "复制" button: copies raw HTML to clipboard

wechat-formatter.html  (Standalone, no AI, no templates, clipboard-only)
```

**Critical duplication:** The Markdown parser (`mdToHtml`, `inlineFormat`, `escapeHtml`) and theme config (`themes`) exist in **both** `popup.js` and `wechat-formatter.html`. This is intentional — the standalone file has no extension APIs. Any parser or theme change must be synced to both files.

**Features exclusive to the Extension** (not in standalone): AI rewrite, smart format, template library, API settings, chrome.storage.

## WeChat compatibility rules

Discovered through iterative testing against `mp.weixin.qq.com`:

| ❌ Never use | ✅ Use instead | Why |
|---|---|---|
| `<div>` | `<section>` | Stripped/rewritten |
| `<pre>`, `<code>` (block-level) | `<table><tr><td>` | Eats code blocks |
| `max-width` | omit entirely | Not supported, breaks cards |
| `box-shadow` | `border: 1px solid` | Filtered |
| `overflow: hidden` | omit | Kills border-radius |
| `execCommand('insertHTML')` | `el.innerHTML = html` + dispatch events | Goes through WeChat paste filter |
| ClipboardItem API | `execCommand('copy')` (tried first) | Copies HTML source → re-filtered |

## MV3 CSP constraints

Extension pages block inline handlers. Always use `addEventListener` in JS, never `onclick`/`oninput` attributes in HTML.

## Markdown parser (mdToHtml)

Parse order: code blocks → headings (h1–h3) → HR → blockquotes → lists (ul/ol) → images → **GFM tables** → paragraphs.

**GFM table support:** Detects standard `|---|---|` tables. Also pre-processes single-line concatenated tables (rows joined without newlines) via inline `|---|` pattern detection.

**Mac Terminal code blocks:** When `theme.codeBlockStyle === 'terminal'`, renders `<table>` with traffic-light buttons (`#FF5F57`/`#FEBC2E`/`#28C840`) and dark background. Newlines converted to `<br>` for WeChat safety.

## AI features (Rewrite tab)

### Style presets (`STYLE_PRESETS`)
6 built-in + 1 custom: 花叔叙事, 技术干货, 学术严谨, 技术博客, 小红书图文, 纯润色, 自定义. Each maps to a system prompt.

### API call (`callAI`)
OpenAI-compatible. Config stored in `chrome.storage.local`: `apiBaseUrl`, `apiKey`, `model`, `temperature`. Default: DeepSeek. `host_permissions` in manifest must include the API domain, or Chrome blocks the cross-origin fetch.

### Smart Format (`doSmartFormat`)
Sends article + compact template reference to AI. AI returns full HTML with template cards woven in. Output goes to result textarea. On "→发送到排版", HTML is detected (`/<[a-z]/i`) and set as `preview.innerHTML` directly — bypassing the Markdown parser.

### `send-to-format-btn` logic
Checks if result contains HTML tags. If yes → `preview.innerHTML = result`. If no → writes to `md-input` and calls `render()` (Markdown pipeline).

## Template library (Template tab)

20 WeChat-safe HTML modules under `TEMPLATES` array. 9 categories: 结构, 文字, 引用, 提示框, 列表, 数据, 分隔, 收尾. All recolored to warm theme (`#C96B3D` accent). Each card has two buttons: "→排版" (direct preview injection) and "复制" (clipboard).

## Injection strategy (`injectIntoWechatEditor`)

Serialized function passed to `chrome.scripting.executeScript`. 3-tier fallback:
1. **contenteditable** — largest visible `[contenteditable="true"]` element
2. **WeChat selectors** — `.rich_media_content`, `#js_content`, `.ql-editor`, etc.
3. **iframe** — legacy UEditor

All tiers use `el.innerHTML = html` + 3 dispatched events (`beforeinput` → `input` → `change`). Never use `execCommand('insertHTML')` — it goes through WeChat's paste filter.

## Running / testing

No build step. Zero dependencies. No package.json.

- **Extension:** `chrome://extensions/` → Load unpacked → project root. Open `mp.weixin.qq.com` article editor → click icon.
- **Standalone:** Open `wechat-formatter.html` in browser.

When `manifest.json` permissions change (`storage`, `host_permissions`), Chrome disables the extension. Remove and re-load unpacked to grant new permissions.

## README policy

- `README.md` — English, GitHub primary
- `README.zh-CN.md` — Chinese, local only, gitignored
