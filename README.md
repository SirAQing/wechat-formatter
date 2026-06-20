# WeChat Article Formatter

> Markdown → richly-styled WeChat Official Account articles. Chrome Extension injects formatted HTML directly into the WeChat editor DOM, bypassing the platform's paste filter entirely.

![Screenshot](OATA.png)

## The Problem

WeChat's built-in editor aggressively sanitizes pasted HTML. Background colors, code blocks, border-radius, and even `<div>` tags are silently stripped or rewritten. Existing Markdown-to-WeChat tools rely on clipboard copy-paste, which means formatting survival is probabilistic at best.

## The Solution

A Chrome Extension (Manifest V3) that formats Markdown into WeChat-safe inline-styled HTML and injects it **directly into the editor DOM** via `chrome.scripting.executeScript` — zero clipboard involvement, zero paste filtering.

## Features

- **One-click sync** — inject formatted HTML straight into the WeChat article editor
- **Markdown → rich text** — headings, body text, blockquotes, code blocks, lists, all with inline styles
- **Anthropic-Tech theme** — a warm terracotta palette tuned for technical writing (34px H1, Mac Terminal code blocks, callout cards)
- **Zero dependencies** — pure HTML/CSS/JS, no build step, no framework
- **Standalone fallback** — open `wechat-formatter.html` in any browser for clipboard-based workflow

## Quick Start

### Chrome Extension (recommended)

1. Navigate to `chrome://extensions/`, enable **Developer mode**
2. Click **Load unpacked** → select the project directory
3. Open `mp.weixin.qq.com` and start editing an article
4. Click the extension icon → write Markdown → click **⚡ Sync**

### Standalone Page

Open `wechat-formatter.html` in your browser → edit → copy → paste into the WeChat editor.

## WeChat Compatibility

Every HTML tag and CSS property is hand-picked against the WeChat editor's known allowlist:

| Used (safe) | Avoided (stripped by WeChat) |
|---|---|
| `section` `table` `p` `blockquote` `h1-h3` | `div` `pre` |
| `border` `background` `border-radius` | `max-width` `box-shadow` `overflow:hidden` |
| `innerHTML` (DOM injection) | `execCommand('insertHTML')` (paste handler) |

## Project Structure

```
├── manifest.json              # Chrome Extension (MV3)
├── popup.html / popup.js      # Extension popup — formatter UI
├── icon.svg                   # Extension icon
├── wechat-formatter.html      # Standalone version (no extension needed)
└── README.zh-CN.md            # 中文文档
```

## License

MIT
