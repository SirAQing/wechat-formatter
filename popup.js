// ============================================================
// 主题配置
// ============================================================
const themes = {
  warm: {
    label: '暖陶色',
    accent: '#C96B3D', heading: '#C96B3D', bold: '#C96B3D', text: '#333333',
    hr: '#e5ded4', quoteBg: '#FFF8EC', quoteText: '#555555',
    codeBg: '#f0eeea', codeText: '#b3401f',
    pageBg: '#F5F5F5', contentBg: '#FAF8F6',
    fontFamily: 'PingFang SC, Microsoft YaHei, sans-serif',
    lineHeight: '2.0', padding: '36px 24px', borderRadius: '8px',
    h1Size: '34px', h1Weight: '700', h1Margin: '40px 0 24px',
    h2Size: '28px', h2Weight: '700', h2Color: '#333333', h2Margin: '36px 0 16px',
    h3Size: '22px', h3Weight: '600', h3Color: '#444444', h3Margin: '28px 0 12px',
    bodySize: '17px', bodyLetterSpacing: '0.3px',
    quoteBorder: '4px', quotePadding: '16px 20px', quoteBorderRadius: '6px', quoteSize: '16px',
    codeBlockStyle: 'terminal',
    terminalBg: '#1E1E1E', terminalBarBg: '#2A2A2A', terminalText: '#E6EDF3',
    codeFont: 'Menlo, Monaco, SFMono-Regular, Consolas, monospace',
    codeBlockFontSize: '14px', codeBlockLineHeight: '2.0',
  }
};
let currentTheme = 'warm';

// ============================================================
// Markdown 解析器
// ============================================================
function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function inlineFormat(text, theme) {
  text = escapeHtml(text);
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (m, alt, url) =>
    `<img src="${url}" alt="${alt}" style="max-width:100%;display:block;margin:16px auto;border-radius:4px;">`);
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, t) =>
    `<span style="color:${theme.accent};text-decoration:underline;">${t}</span>`);
  text = text.replace(/\*\*([^*]+)\*\*/g, (m, t) =>
    `<strong style="font-weight:bold;color:${theme.bold};">${t}</strong>`);
  text = text.replace(/\*([^*]+)\*/g, (m, t) =>
    `<em style="font-style:italic;">${t}</em>`);
  text = text.replace(/`([^`]+)`/g, (m, t) =>
    `<code style="background:${theme.codeBg};color:${theme.codeText};padding:2px 6px;border-radius:3px;font-family:${theme.codeFont || 'Consolas,Monaco,monospace'};font-size:14px;">${t}</code>`);
  return text;
}

function mdToHtml(md, theme) {
  const lines = md.split('\n');
  let html = '';
  let i = 0;
  let listBuffer = [];
  let listType = null;

  function flushList() {
    if (listBuffer.length) { html += listBuffer.join(''); listBuffer = []; listType = null; }
  }

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { flushList(); i++; continue; }

    // 代码块
    if (line.trim().startsWith('```')) {
      flushList();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { codeLines.push(lines[i]); i++; }
      i++;
      const codeText = escapeHtml(codeLines.join('\n'));
      if (theme.codeBlockStyle === 'terminal') {
        html += `<table style="width:100%;background:${theme.terminalBg};border-radius:12px;border:1px solid #333;margin:24px 0;">
          <tr><td style="padding:10px 16px;background:${theme.terminalBarBg};">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#FF5F57;margin-right:8px;"></span>
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#FEBC2E;margin-right:8px;"></span>
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#28C840;"></span>
          </td></tr>
          <tr><td style="padding:20px;color:${theme.terminalText};font-family:${theme.codeFont || 'Consolas,Monaco,monospace'};line-height:${theme.codeBlockLineHeight || '2.0'};font-size:${theme.codeBlockFontSize || '14px'};">
            ${codeText.replace(/\n/g,'<br>')}
          </td></tr>
        </table>`;
      } else {
        html += `<table style="width:100%;background:${theme.codeBlockBg};border-radius:6px;margin:16px 0;">
          <tr><td style="padding:16px;color:${theme.codeBlockText};font-family:${theme.codeFont || 'Consolas,Monaco,monospace'};font-size:13px;line-height:1.6;">
            ${codeText.replace(/\n/g,'<br>')}
          </td></tr>
        </table>`;
      }
      continue;
    }

    // 标题
    const headingMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const sizeMap  = { 1: theme.h1Size || '22px', 2: theme.h2Size || '19px', 3: theme.h3Size || '17px' };
      const weightMap = { 1: theme.h1Weight || 'bold', 2: theme.h2Weight || 'bold', 3: theme.h3Weight || 'bold' };
      const colorMap  = { 1: theme.heading, 2: theme.h2Color || theme.heading, 3: theme.h3Color || theme.heading };
      const marginMap = { 1: theme.h1Margin || '28px 0 18px', 2: theme.h2Margin || '24px 0 12px', 3: theme.h3Margin || '24px 0 12px' };
      html += `<h${level} style="font-size:${sizeMap[level]};font-weight:${weightMap[level]};color:${colorMap[level]};text-align:${level === 1 ? 'center' : 'left'};margin:${marginMap[level]};line-height:1.4;">${inlineFormat(headingMatch[2], theme)}</h${level}>`;
      i++; continue;
    }

    // 分隔线
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      flushList();
      html += `<hr style="border:none;border-top:1px solid ${theme.hr};margin:28px 0;">`;
      i++; continue;
    }

    // 引用
    if (line.trim().startsWith('>')) {
      flushList();
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, '')); i++;
      }
      html += `<blockquote style="border-left:${theme.quoteBorder || '3px'} solid ${theme.accent};background:${theme.quoteBg};color:${theme.quoteText};padding:${theme.quotePadding || '12px 18px'};margin:20px 0;border-radius:${theme.quoteBorderRadius || '0 4px 4px 0'};font-size:${theme.quoteSize || '15px'};line-height:${theme.lineHeight || '1.8'};${theme.bodyLetterSpacing ? `letter-spacing:${theme.bodyLetterSpacing}` : ''}">${quoteLines.map(l => inlineFormat(l, theme)).join('<br>')}</blockquote>`;
      continue;
    }

    // 无序列表
    const ulMatch = line.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      listBuffer.push(`<p style="margin:10px 0;line-height:${theme.lineHeight || '1.8'};font-size:${theme.bodySize || '16px'};color:${theme.text};"><span style="color:${theme.accent};margin-right:8px;">●</span><span>${inlineFormat(ulMatch[1], theme)}</span></p>`);
      i++; continue;
    }

    // 有序列表
    const olMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      listBuffer.push(`<p style="margin:10px 0;line-height:${theme.lineHeight || '1.8'};font-size:${theme.bodySize || '16px'};color:${theme.text};"><span style="color:${theme.accent};font-weight:bold;margin-right:8px;">${olMatch[1]}.</span><span>${inlineFormat(olMatch[2], theme)}</span></p>`);
      i++; continue;
    }

    // 独立图片
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      flushList();
      html += `<p style="margin:16px 0;text-align:center;"><img src="${imgMatch[2]}" alt="${imgMatch[1]}" style="max-width:100%;border-radius:4px;"></p>`;
      i++; continue;
    }

    // 段落
    flushList();
    const paraLines = [line]; i++;
    while (i < lines.length && lines[i].trim() !== '' &&
      !/^#{1,3}\s/.test(lines[i]) && !/^[-*]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) && !lines[i].trim().startsWith('>') &&
      !lines[i].trim().startsWith('```') && !/^(-{3,}|\*{3,})$/.test(lines[i].trim())
    ) { paraLines.push(lines[i]); i++; }
    html += `<p style="margin:16px 0;line-height:${theme.lineHeight || '1.8'};font-size:${theme.bodySize || '16px'};color:${theme.text};${theme.bodyLetterSpacing ? `letter-spacing:${theme.bodyLetterSpacing}` : ''}">${paraLines.map(l => inlineFormat(l, theme)).join(' ')}</p>`;
  }
  flushList();
  return html;
}

// ============================================================
// 渲染
// ============================================================
function render() {
  const md = document.getElementById('md-input').value;
  const theme = themes[currentTheme];
  const bodyHtml = mdToHtml(md, theme);

  const previewEl = document.getElementById('preview');
  const card = [
    theme.contentBg   ? `background:${theme.contentBg}` : '',
    theme.fontFamily  ? `font-family:${theme.fontFamily}` : '',
    theme.padding     ? `padding:${theme.padding}` : '',
    theme.borderRadius ? `border-radius:${theme.borderRadius}` : '',
  ].filter(Boolean).join(';');

  previewEl.innerHTML = `<section style="${card}">${bodyHtml}</section>`;
}

// ============================================================
// 主题切换
// ============================================================
function buildThemeBar() {
  const bar = document.getElementById('theme-bar');
  Object.keys(themes).forEach(key => {
    const tag = document.createElement('span');
    tag.className = 'theme-tag' + (key === currentTheme ? ' active' : '');
    tag.textContent = themes[key].label;
    tag.onclick = () => setTheme(key);
    bar.appendChild(tag);
  });
}

function setTheme(name) {
  currentTheme = name;
  document.querySelectorAll('.theme-tag').forEach(t => {
    t.classList.toggle('active', t.textContent === themes[name].label);
  });
  render();
}

// ============================================================
// Toast
// ============================================================
function showToast(msg, ok) {
  const toast = document.getElementById('toast');
  toast.style.display = 'block';
  toast.className = ok ? 'toast-ok' : 'toast-err';
  toast.textContent = msg;
  setTimeout(() => { toast.style.display = 'none'; }, 3500);
}

// ============================================================
// 复制到剪贴板
// ============================================================
async function copyToClipboard() {
  const previewEl = document.getElementById('preview');
  let success = false;

  // 优先 execCommand：复制富文本 DOM，公众号识别率更高
  try {
    const range = document.createRange();
    range.selectNodeContents(previewEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    success = document.execCommand('copy');
    sel.removeAllRanges();
  } catch (e) {}

  if (!success) {
    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const item = new ClipboardItem({
          'text/html': new Blob([previewEl.innerHTML], { type: 'text/html' }),
          'text/plain': new Blob([previewEl.innerText], { type: 'text/plain' })
        });
        await navigator.clipboard.write([item]);
        success = true;
      }
    } catch (e) {}
  }

  showToast(success ? '已复制，可粘贴到公众号草稿箱' : '复制失败，请手动 Ctrl+C', success);
}

// ============================================================
// 一键同步到公众号（核心功能）
// ============================================================
async function syncToWechat() {
  const btn = document.getElementById('sync-btn');
  const html = document.getElementById('preview').innerHTML;

  if (!html || html === '<section style=""></section>') {
    showToast('请先输入内容', false);
    return;
  }

  btn.disabled = true;
  btn.textContent = '同步中...';
  showToast('正在连接公众号编辑器...', true);

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url || !tab.url.includes('mp.weixin.qq.com')) {
      showToast('请在公众号图文编辑页面使用此功能\n（当前页面非 mp.weixin.qq.com）', false);
      btn.disabled = false;
      btn.innerHTML = '⚡ 一键同步到公众号';
      return;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectIntoWechatEditor,
      args: [html]
    });

    const result = results[0].result;
    if (result.success) {
      showToast(`已同步到公众号编辑器（通过 ${result.method}）`, true);
    } else {
      showToast(result.error || '同步失败：未找到编辑器容器', false);
    }
  } catch (e) {
    showToast('同步失败：' + (e.message || '请确认已在公众号图文编辑页面'), false);
  }

  btn.disabled = false;
  btn.innerHTML = '⚡ 一键同步到公众号';
}

// ============================================================
// 注入函数（序列化后在微信页面执行，不能引用外部变量）
// ============================================================
function injectIntoWechatEditor(html) {
  // 派发事件的公共函数
  function fireEvents(el) {
    el.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, composed: true, inputType: 'insertFromPaste' }));
    el.dispatchEvent(new InputEvent('input',       { bubbles: true, composed: true, inputType: 'insertFromPaste' }));
    el.dispatchEvent(new Event('change',           { bubbles: true }));
  }

  // 核心注入：直接 innerHTML，不用 execCommand('insertHTML')——后者走微信 paste 过滤器会丢掉格式
  function inject(el) {
    el.focus();
    el.innerHTML = html;
    fireEvents(el);
  }

  // Strategy 1: contenteditable（新版 React 编辑器）——按面积选最大的正文区
  const editables = document.querySelectorAll('[contenteditable="true"]');
  const sorted = Array.from(editables)
    .filter(el => el.offsetParent !== null)
    .sort((a, b) => (b.offsetWidth * b.offsetHeight) - (a.offsetWidth * a.offsetHeight));

  if (sorted.length > 0) {
    inject(sorted[0]);
    return { success: true, method: 'contenteditable' };
  }

  // Strategy 2: WeChat 特定选择器
  const wechatSelectors = [
    '.rich_media_content', '#js_content',
    '.editor-wrapper [contenteditable]', '.editor-content',
    '.ql-editor', '.ProseMirror',
    '.public-DraftEditor-content', '[data-editro]',
    '[role="textbox"]'
  ];
  for (const sel of wechatSelectors) {
    const el = document.querySelector(sel);
    if (el && el.offsetParent !== null) {
      inject(el);
      return { success: true, method: 'selector' };
    }
  }

  // Strategy 3: iframe 编辑器（旧版 UEditor）
  const iframes = document.querySelectorAll('iframe');
  for (const iframe of iframes) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      if (!doc) continue;
      const body = doc.body;
      if (!body || !body.offsetParent) continue;

      body.focus();
      body.innerHTML = html;
      body.dispatchEvent(new InputEvent('input', { bubbles: true, composed: true }));
      return { success: true, method: 'iframe' };
    } catch(e) {}
  }

  return { success: false, error: '未找到编辑器容器。请在图文编辑页面（非预览/列表页）打开此插件' };
}

// ============================================================
// 启动
// ============================================================
document.getElementById('md-input').value =
`# 我为什么非得把整本书重写

四月那本，基于的是 Hermes v0.7.0。现在它已经到 v0.16.0 了。

这两个月它长出来的东西，我列一下你感受：

- 原生桌面 App、浏览器管理面板
- 简体中文支持、23 个消息平台接入
- 一群 Agent 协同干活的多 Agent 看板
- 一套认真写过的安全模型

官方自己把这一版命名为 **「The Surface Release」**，意思就是让你在任何地方都摸得到它。

> GitHub 简介从过去的「self-improving」换成了「The agent that grows with you」。

一个会自己改自己的 Agent，边界到底在哪，谁来看着它？`;

buildThemeBar();
render();

// MV3 CSP 禁止内联 onclick/oninput，必须用 addEventListener
document.getElementById('md-input').addEventListener('input', render);
document.getElementById('sync-btn').addEventListener('click', syncToWechat);
document.getElementById('copy-btn').addEventListener('click', copyToClipboard);
