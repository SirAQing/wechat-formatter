// ============================================================
// 风格预设
// ============================================================
const STYLE_PRESETS = {
  huashu: {
    label:'花叔叙事',
    prompt:`你是花叔，一个AI技术博主。把以下内容改写成公众号文章。风格：第一人称叙事，技术干货+轻营销感，段落短每段不超过4句，保留所有代码和技术细节，结尾给可操作的takeaway。`
  },
  tech: {
    label:'技术干货',
    prompt:`你是技术编辑。把以下内容改写成简洁直接的技术文章。风格：去掉个人叙事和情感化表达，保留所有代码和技术细节，每段不超过4句话，用主动语态，小标题用动词开头。`
  },
  academic: {
    label:'学术严谨',
    prompt:`你是学术编辑。把以下内容改写成严谨的技术文档。风格：结构化（背景→方法→结果→结论），避免口语/emoji/感叹号，客观中性不用第一人称，术语准确首次出现时给出定义。`
  },
  blog: {
    label:'技术博客',
    prompt:`你是Anthropic/Vercel风格的技术博客作者。改写以下内容。风格：冷静克制不卖弄，短段落多留白，用具体例子代替抽象描述，代码块要有上下文说明。`
  },
  xiaohongshu: {
    label:'小红书图文',
    prompt:`把以下内容改写成小红书图文风格。风格：短句大量换行，适当使用emoji，口语化像在跟朋友聊天，技术内容拆成"懒人包"一眼看懂。`
  },
  polish: {
    label:'纯润色',
    prompt:`你是文字编辑。润色以下内容。风格：不改变原文风格和结构，优化表达流畅度和逻辑衔接，修正错别字和语法，不做内容增删。`
  },
  custom: {
    label:'自定义',
    prompt:''
  }
};

// ============================================================
// 主题
// ============================================================
const themes = {
  warm: {
    label:'暖陶色',
    accent:'#C96B3D', heading:'#C96B3D', bold:'#C96B3D', text:'#333333',
    hr:'#e5ded4', quoteBg:'#FFF8EC', quoteText:'#555555',
    codeBg:'#f0eeea', codeText:'#b3401f',
    pageBg:'#F5F5F5', contentBg:'#FAF8F6',
    fontFamily:'PingFang SC, Microsoft YaHei, sans-serif',
    lineHeight:'2.0', padding:'36px 24px', borderRadius:'8px',
    h1Size:'34px', h1Weight:'700', h1Margin:'40px 0 24px',
    h2Size:'28px', h2Weight:'700', h2Color:'#333333', h2Margin:'36px 0 16px',
    h3Size:'22px', h3Weight:'600', h3Color:'#444444', h3Margin:'28px 0 12px',
    bodySize:'17px', bodyLetterSpacing:'0.3px',
    quoteBorder:'4px', quotePadding:'16px 20px', quoteBorderRadius:'6px', quoteSize:'16px',
    codeBlockStyle:'terminal',
    terminalBg:'#1E1E1E', terminalBarBg:'#2A2A2A', terminalText:'#E6EDF3',
    codeFont:'Menlo, Monaco, SFMono-Regular, Consolas, monospace',
    codeBlockFontSize:'14px', codeBlockLineHeight:'2.0',
  }
};
let currentTheme = 'warm';
let currentStyle = 'huashu';

// ============================================================
// Markdown 解析器
// ============================================================
function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function inlineFormat(text,theme){
  text=escapeHtml(text);
  text=text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,(m,alt,url)=>`<img src="${url}" alt="${alt}" style="max-width:100%;display:block;margin:16px auto;border-radius:4px;">`);
  text=text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,(m,t)=>`<span style="color:${theme.accent};text-decoration:underline;">${t}</span>`);
  text=text.replace(/\*\*([^*]+)\*\*/g,(m,t)=>`<strong style="font-weight:bold;color:${theme.bold};">${t}</strong>`);
  text=text.replace(/\*([^*]+)\*/g,(m,t)=>`<em style="font-style:italic;">${t}</em>`);
  text=text.replace(/`([^`]+)`/g,(m,t)=>`<code style="background:${theme.codeBg};color:${theme.codeText};padding:2px 6px;border-radius:3px;font-family:${theme.codeFont||'Consolas,Monaco,monospace'};font-size:14px;">${t}</code>`);
  return text;
}

function mdToHtml(md,theme){
  md=md.split('\n').map(line=>{
    const t=line.trim();
    if(/^\|[\s:-]+\|$/.test(t))return line;
    if(!t.startsWith('|')||!t.endsWith('|'))return line;
    const sepRe=/\|[\s:-]+\|[\s:-]+\|/;
    const m=t.match(sepRe);
    if(!m)return line;
    const sepCells=m[0].split('|').filter(c=>c.trim());
    const n=sepCells.length;
    const header=t.substring(0,m.index);
    const cells=t.substring(m.index+m[0].length).split('|').map(c=>c.trim()).filter(c=>c);
    const rows=[header+'|'];
    rows.push('|'+sepCells.join('|')+'|');
    for(let i=0;i<cells.length;i+=n)rows.push('| '+cells.slice(i,i+n).join(' | ')+' |');
    return rows.join('\n');
  }).join('\n');

  const lines=md.split('\n');
  let html='',i=0,listBuffer=[],listType=null;
  function flushList(){ if(listBuffer.length){html+=listBuffer.join('');listBuffer=[];listType=null;} }

  while(i<lines.length){
    const line=lines[i];
    if(line.trim()===''){flushList();i++;continue;}

    if(line.trim().startsWith('```')){
      flushList();
      const codeLines=[];i++;
      while(i<lines.length&&!lines[i].trim().startsWith('```')){codeLines.push(lines[i]);i++;}
      i++;
      const codeText=escapeHtml(codeLines.join('\n'));
      if(theme.codeBlockStyle==='terminal'){
        html+=`<table style="width:100%;background:${theme.terminalBg};border-radius:12px;border:1px solid #333;margin:24px 0;"><tr><td style="padding:10px 16px;background:${theme.terminalBarBg};"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#FF5F57;margin-right:8px;"></span><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#FEBC2E;margin-right:8px;"></span><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#28C840;"></span></td></tr><tr><td style="padding:20px;color:${theme.terminalText};font-family:${theme.codeFont||'Consolas,Monaco,monospace'};line-height:${theme.codeBlockLineHeight||'2.0'};font-size:${theme.codeBlockFontSize||'14px'};">${codeText.replace(/\n/g,'<br>')}</td></tr></table>`;
      }else{
        html+=`<table style="width:100%;background:${theme.codeBlockBg};border-radius:6px;margin:16px 0;"><tr><td style="padding:16px;color:${theme.codeBlockText};font-family:${theme.codeFont||'Consolas,Monaco,monospace'};font-size:13px;line-height:1.6;">${codeText.replace(/\n/g,'<br>')}</td></tr></table>`;
      }
      continue;
    }

    const headingMatch=line.match(/^(#{1,3})\s+(.*)$/);
    if(headingMatch){
      flushList();
      const lv=headingMatch[1].length;
      const sz={1:theme.h1Size||'22px',2:theme.h2Size||'19px',3:theme.h3Size||'17px'};
      const wt={1:theme.h1Weight||'bold',2:theme.h2Weight||'bold',3:theme.h3Weight||'bold'};
      const cl={1:theme.heading,2:theme.h2Color||theme.heading,3:theme.h3Color||theme.heading};
      const mg={1:theme.h1Margin||'28px 0 18px',2:theme.h2Margin||'24px 0 12px',3:theme.h3Margin||'24px 0 12px'};
      html+=`<h${lv} style="font-size:${sz[lv]};font-weight:${wt[lv]};color:${cl[lv]};text-align:${lv===1?'center':'left'};margin:${mg[lv]};line-height:1.4;">${inlineFormat(headingMatch[2],theme)}</h${lv}>`;
      i++;continue;
    }

    if(/^(-{3,}|\*{3,})$/.test(line.trim())){
      flushList();
      html+=`<hr style="border:none;border-top:1px solid ${theme.hr};margin:28px 0;">`;
      i++;continue;
    }

    if(line.trim().startsWith('>')){
      flushList();
      const ql=[];while(i<lines.length&&lines[i].trim().startsWith('>')){ql.push(lines[i].trim().replace(/^>\s?/,''));i++;}
      html+=`<blockquote style="border-left:${theme.quoteBorder||'3px'} solid ${theme.accent};background:${theme.quoteBg};color:${theme.quoteText};padding:${theme.quotePadding||'12px 18px'};margin:20px 0;border-radius:${theme.quoteBorderRadius||'0 4px 4px 0'};font-size:${theme.quoteSize||'15px'};line-height:${theme.lineHeight||'1.8'};${theme.bodyLetterSpacing?'letter-spacing:'+theme.bodyLetterSpacing:''}">${ql.map(l=>inlineFormat(l,theme)).join('<br>')}</blockquote>`;
      continue;
    }

    const ulMatch=line.match(/^[-*]\s+(.*)$/);
    if(ulMatch){
      if(listType!=='ul')flushList();listType='ul';
      listBuffer.push(`<p style="margin:10px 0;line-height:${theme.lineHeight||'1.8'};font-size:${theme.bodySize||'16px'};color:${theme.text};"><span style="color:${theme.accent};margin-right:8px;">●</span><span>${inlineFormat(ulMatch[1],theme)}</span></p>`);
      i++;continue;
    }

    const olMatch=line.match(/^(\d+)\.\s+(.*)$/);
    if(olMatch){
      if(listType!=='ol')flushList();listType='ol';
      listBuffer.push(`<p style="margin:10px 0;line-height:${theme.lineHeight||'1.8'};font-size:${theme.bodySize||'16px'};color:${theme.text};"><span style="color:${theme.accent};font-weight:bold;margin-right:8px;">${olMatch[1]}.</span><span>${inlineFormat(olMatch[2],theme)}</span></p>`);
      i++;continue;
    }

    const imgMatch=line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if(imgMatch){
      flushList();
      html+=`<p style="margin:16px 0;text-align:center;"><img src="${imgMatch[2]}" alt="${imgMatch[1]}" style="max-width:100%;border-radius:4px;"></p>`;
      i++;continue;
    }

    if(/^\|.+\|$/.test(line)&&i+1<lines.length&&/^\|[\s:-]+\|$/.test(lines[i+1].trim())){
      flushList();
      const hc=line.replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
      const sc=lines[i+1].trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
      const al=sc.map(c=>{if(c.startsWith(':')&&c.endsWith(':'))return'center';if(c.endsWith(':'))return'right';return'left';});
      i+=2;
      const br=[];while(i<lines.length&&/^\|.+\|$/.test(lines[i].trim())){br.push(lines[i].trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim()));i++;}
      html+=`<table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:15px;line-height:${theme.lineHeight||'1.8'};">`;
      html+=`<tr>`;hc.forEach((c,idx)=>{html+=`<td style="background:${theme.accent};color:#fff;padding:10px 14px;border:1px solid ${theme.accent};font-weight:600;text-align:${al[idx]||'left'};">${inlineFormat(c,theme)}</td>`;});html+=`</tr>`;
      br.forEach((row,ri)=>{const bg=ri%2===0?'#fff':'#fafaf7';html+=`<tr>`;row.forEach((c,ci)=>{html+=`<td style="background:${bg};padding:10px 14px;border:1px solid #e0ddd5;color:${theme.text};text-align:${al[ci]||'left'};">${inlineFormat(c,theme)}</td>`;});html+=`</tr>`;});
      html+=`</table>`;
      continue;
    }

    flushList();
    const pl=[line];i++;
    while(i<lines.length&&lines[i].trim()!==''&&!/^#{1,3}\s/.test(lines[i])&&!/^[-*]\s/.test(lines[i])&&!/^\d+\.\s/.test(lines[i])&&!lines[i].trim().startsWith('>')&&!lines[i].trim().startsWith('```')&&!/^(-{3,}|\*{3,})$/.test(lines[i].trim())){pl.push(lines[i]);i++;}
    html+=`<p style="margin:16px 0;line-height:${theme.lineHeight||'1.8'};font-size:${theme.bodySize||'16px'};color:${theme.text};${theme.bodyLetterSpacing?'letter-spacing:'+theme.bodyLetterSpacing:''}">${pl.map(l=>inlineFormat(l,theme)).join(' ')}</p>`;
  }
  flushList();
  return html;
}

// ============================================================
// 渲染 & 主题
// ============================================================
function render(){
  const md=document.getElementById('md-input').value;
  const theme=themes[currentTheme];
  const bodyHtml=mdToHtml(md,theme);
  const previewEl=document.getElementById('preview');
  const card=[theme.contentBg?`background:${theme.contentBg}`:'',theme.fontFamily?`font-family:${theme.fontFamily}`:'',theme.padding?`padding:${theme.padding}`:'',theme.borderRadius?`border-radius:${theme.borderRadius}`:''].filter(Boolean).join(';');
  previewEl.innerHTML=`<section style="${card}">${bodyHtml}</section>`;
}

function buildThemeBar(){
  const bar=document.getElementById('theme-bar');bar.innerHTML='';
  Object.keys(themes).forEach(key=>{
    const tag=document.createElement('span');
    tag.className='theme-tag'+(key===currentTheme?' active':'');
    tag.textContent=themes[key].label;
    tag.onclick=()=>{currentTheme=key;buildThemeBar();render();};
    bar.appendChild(tag);
  });
}

// ============================================================
// Toast
// ============================================================
function showToast(msg,ok){
  const toast=document.getElementById('toast');
  toast.style.display='block';
  toast.className=ok?'toast-ok':'toast-err';
  toast.textContent=msg;
  setTimeout(()=>{toast.style.display='none';},3500);
}

// ============================================================
// 复制 & 同步
// ============================================================
async function copyToClipboard(){
  const previewEl=document.getElementById('preview');
  let success=false;
  try{const range=document.createRange();range.selectNodeContents(previewEl);const sel=window.getSelection();sel.removeAllRanges();sel.addRange(range);success=document.execCommand('copy');sel.removeAllRanges();}catch(e){}
  if(!success){
    try{if(navigator.clipboard&&window.ClipboardItem){const item=new ClipboardItem({'text/html':new Blob([previewEl.innerHTML],{type:'text/html'}),'text/plain':new Blob([previewEl.innerText],{type:'text/plain'})});await navigator.clipboard.write([item]);success=true;}}catch(e){}
  }
  showToast(success?'已复制，可粘贴到公众号草稿箱':'复制失败，请手动 Ctrl+C',success);
}

async function syncToWechat(){
  const btn=document.getElementById('sync-btn');
  const html=document.getElementById('preview').innerHTML;
  if(!html||html==='<section style=""></section>'){showToast('请先输入内容',false);return;}
  btn.disabled=true;btn.textContent='同步中...';
  showToast('正在连接公众号编辑器...',true);
  try{
    const[tab]=await chrome.tabs.query({active:true,currentWindow:true});
    if(!tab.url||!tab.url.includes('mp.weixin.qq.com')){showToast('请在公众号图文编辑页面使用此功能',false);btn.disabled=false;btn.textContent='⚡ 一键同步';return;}
    const results=await chrome.scripting.executeScript({target:{tabId:tab.id},func:injectIntoWechatEditor,args:[html]});
    const result=results[0].result;
    showToast(result.success?'已同步到公众号编辑器':(result.error||'未找到编辑器容器'),result.success);
  }catch(e){showToast('同步失败：'+(e.message||'请确认已在公众号图文编辑页面'),false);}
  btn.disabled=false;btn.textContent='⚡ 一键同步';
}

function injectIntoWechatEditor(html){
  function fireEvents(el){el.dispatchEvent(new InputEvent('beforeinput',{bubbles:true,composed:true,inputType:'insertFromPaste'}));el.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true,inputType:'insertFromPaste'}));el.dispatchEvent(new Event('change',{bubbles:true}));}
  function inject(el){el.focus();el.innerHTML=html;fireEvents(el);}
  const editables=document.querySelectorAll('[contenteditable="true"]');
  const sorted=Array.from(editables).filter(el=>el.offsetParent!==null).sort((a,b)=>(b.offsetWidth*b.offsetHeight)-(a.offsetWidth*a.offsetHeight));
  if(sorted.length>0){inject(sorted[0]);return{success:true,method:'contenteditable'};}
  const wechatSelectors=['.rich_media_content','#js_content','.editor-wrapper [contenteditable]','.editor-content','.ql-editor','.ProseMirror','.public-DraftEditor-content','[data-editro]','[role="textbox"]'];
  for(const sel of wechatSelectors){const el=document.querySelector(sel);if(el&&el.offsetParent!==null){inject(el);return{success:true,method:'selector'};}}
  const iframes=document.querySelectorAll('iframe');
  for(const iframe of iframes){try{const doc=iframe.contentDocument||iframe.contentWindow.document;if(!doc)continue;const body=doc.body;if(!body||!body.offsetParent)continue;body.focus();body.innerHTML=html;body.dispatchEvent(new InputEvent('input',{bubbles:true,composed:true}));return{success:true,method:'iframe'};}catch(e){}}
  return{success:false,error:'未找到编辑器容器。请在图文编辑页面（非预览/列表页）打开此插件'};
}

// ============================================================
// Tab
// ============================================================
function switchTab(name){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===name));
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id==='panel-'+name));
}

// ============================================================
// API
// ============================================================
async function getAPIConfig(){
  const defaults={apiBaseUrl:'https://api.deepseek.com/v1',apiKey:'',model:'deepseek-chat',temperature:'0.7'};
  const stored=await chrome.storage.local.get(['apiBaseUrl','apiKey','model','temperature']);
  return{...defaults,...stored};
}

async function callAI(draft,styleKey,customPrompt){
  const config=await getAPIConfig();
  if(!config.apiKey)throw new Error('请先配置 API Key（点击 ⚙️）');
  const preset=STYLE_PRESETS[styleKey];
  const systemPrompt=(styleKey==='custom'||customPrompt)?(customPrompt||preset.prompt):preset.prompt;
  let resp;
  try{
    const base=config.apiBaseUrl.replace(/\/+$/,'');
    resp=await fetch(base+'/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+config.apiKey},
      body:JSON.stringify({model:config.model,messages:[{role:'system',content:systemPrompt},{role:'user',content:draft}],temperature:parseFloat(config.temperature)||0.7,max_tokens:4096})
    });
  }catch(e){
    if(e.message.includes('Failed to fetch')||e.name==='TypeError')throw new Error('网络请求被拦截。请在 manifest.json 的 host_permissions 中添加该 API 域名，然后移除并重新加载扩展');
    throw new Error('网络请求失败：'+e.message);
  }
  if(!resp.ok){
    if(resp.status===401)throw new Error('API Key 无效 (401)');
    if(resp.status===404)throw new Error('接口不存在 (404)。地址：'+config.apiBaseUrl+'/chat/completions');
    if(resp.status===429)throw new Error('请求太频繁，请稍候 (429)');
    if(resp.status>=500)throw new Error('服务端异常 ('+resp.status+')，请稍候重试');
    let detail='';try{const d=await resp.json();detail=': '+(d.error?.message||JSON.stringify(d));}catch(e){}
    throw new Error('API 错误 ('+resp.status+')'+detail+' | 模型：'+config.model);
  }
  const data=await resp.json();
  const content=data.choices?.[0]?.message?.content;
  if(!content)throw new Error('模型未返回内容');
  return content.trim();
}

// ============================================================
// AI 改写
// ============================================================
async function doRewrite(){
  const draft=document.getElementById('draft-input').value.trim();
  if(!draft){showToast('请先输入草稿内容',false);return;}
  const btn=document.getElementById('rewrite-btn'),resultArea=document.getElementById('result-output');
  btn.disabled=true;btn.textContent='⏳ 改写中...';resultArea.value='';
  try{
    const styleKey=document.getElementById('style-select').value;
    const customPrompt=document.getElementById('custom-prompt-box').querySelector('textarea').value.trim();
    const result=await callAI(draft,styleKey,customPrompt);
    resultArea.value=result;
    document.getElementById('retry-btn').disabled=false;
    document.getElementById('copy-result-btn').disabled=false;
    document.getElementById('send-to-format-btn').disabled=false;
    showToast('改写完成',true);
  }catch(e){resultArea.value='❌ '+e.message;showToast(e.message,false);}
  btn.disabled=false;btn.textContent='🤖 AI 改写';
}

// ============================================================
// 智能排版
// ============================================================
const A='#C96B3D';
const TEMPLATES=[
  {id:'t01',cat:'结构',name:'文章标题栏',html:`<section style="text-align:center;padding:28px 12px 20px;border-bottom:1px solid #f0f0f0">\n  <h1 style="font-size:22px;font-weight:bold;color:#1a1a1a;line-height:1.5;margin:0 0 10px 0">在这里放文章标题，简洁有力不超 20 字</h1>\n  <p style="font-size:13px;color:#999;margin:0">作者：编辑部 | 预计阅读 5 分钟</p>\n</section>`},
  {id:'t02',cat:'结构',name:'导读摘要',html:`<p style="font-size:15px;color:#555;line-height:1.9;margin:16px 0;padding:14px;background:#FFF8EC;border-left:3px solid ${A}">导读：这里用 1-3 句话概括文章核心，让读者判断是否值得继续阅读。简洁有力，直指价值。</p>`},
  {id:'t03',cat:'文字',name:'二级标题',html:`<h2 style="font-size:18px;font-weight:bold;color:#1a1a1a;margin:28px 0 10px 0;padding-left:12px;border-left:4px solid ${A};line-height:1.4">第一节：节标题放在这里</h2>`},
  {id:'t04',cat:'文字',name:'三级标题',html:`<h3 style="font-size:16px;font-weight:bold;color:#333;margin:20px 0 8px 0">▌ 小节标题放在这里</h3>`},
  {id:'t05',cat:'文字',name:'正文段落',html:`<p style="font-size:15px;color:#333;line-height:1.9;margin:0 0 14px 0">正文段落放在这里。可以用 <strong style="color:${A}">暖陶色加粗</strong> 强调关键词，让读者扫读时抓住重点。</p>`},
  {id:'t06',cat:'文字',name:'行内高亮',html:`<p style="font-size:15px;color:#333;line-height:1.9;margin:0 0 14px 0">行内：<span style="background:#fff3cd;padding:2px 6px;border-radius:3px;font-weight:bold;color:#856404">黄色高亮</span> 警示，<span style="background:#f2e0d0;padding:2px 6px;border-radius:3px;font-weight:bold;color:#70381a">暖色高亮</span> 强调。</p>`},
  {id:'t07',cat:'引用',name:'引用（边框款）',html:`<blockquote style="margin:18px 0;padding:14px 14px;background:#FFF8EC;border-left:4px solid ${A}">\n  <p style="font-size:14px;color:#444;line-height:1.8;margin:0">引用内容放在这里，数据来源、名人名言或核心论据都适合。</p>\n  <p style="font-size:12px;color:#999;margin:8px 0 0">—— 来源：某某报告</p>\n</blockquote>`},
  {id:'t08',cat:'引用',name:'引用（大字居中）',html:`<blockquote style="margin:22px 0;padding:22px 16px;background:#fafafa;border:none;text-align:center">\n  <p style="font-size:18px;color:#333;line-height:1.7;font-weight:bold;margin:0">❝ 一句让人印象深刻的话，居中大字展示 ❞</p>\n  <p style="font-size:13px;color:#999;margin:10px 0 0">—— 作者 / 来源</p>\n</blockquote>`},
  {id:'t09',cat:'引用',name:'研究发现卡',html:`<section style="margin:18px 0;padding:18px;background:#f6f8fa;border-radius:6px">\n  <p style="font-size:13px;color:${A};font-weight:bold;margin:0 0 8px 0">📖 研究发现</p>\n  <p style="font-size:15px;color:#333;line-height:1.8;margin:0">引用的数据、研究结论或权威观点放在这里。</p>\n</section>`},
  {id:'t10',cat:'提示框',name:'暖色提示',html:`<section style="margin:18px 0;padding:14px 14px;background:#FFF8EC;border:1px solid #e8ceb8;border-radius:6px">\n  <p style="font-size:13px;font-weight:bold;color:${A};margin:0 0 6px 0">💡 小贴士</p>\n  <p style="font-size:14px;color:#444;line-height:1.7;margin:0">实用技巧、操作建议或补充说明放在这里。</p>\n</section>`},
  {id:'t11',cat:'提示框',name:'黄色警告',html:`<section style="margin:18px 0;padding:14px 14px;background:#fffbe6;border:1px solid #ffe58f;border-radius:6px">\n  <p style="font-size:13px;font-weight:bold;color:#d48806;margin:0 0 6px 0">⚠️ 注意事项</p>\n  <p style="font-size:14px;color:#555;line-height:1.7;margin:0">需要特别注意的内容，可能导致错误或损失的操作。</p>\n</section>`},
  {id:'t12',cat:'提示框',name:'蓝色信息',html:`<section style="margin:18px 0;padding:14px 14px;background:#e6f4ff;border:1px solid #91caff;border-radius:6px">\n  <p style="font-size:13px;font-weight:bold;color:#1677ff;margin:0 0 6px 0">📌 延伸阅读</p>\n  <p style="font-size:14px;color:#444;line-height:1.7;margin:0">补充资料、背景知识或延伸阅读说明放在这里。</p>\n</section>`},
  {id:'t13',cat:'提示框',name:'红色重要',html:`<section style="margin:18px 0;padding:14px 14px;background:#fff2f0;border:1px solid #ffccc7;border-radius:6px">\n  <p style="font-size:13px;font-weight:bold;color:#cf1322;margin:0 0 6px 0">🚨 重要提醒</p>\n  <p style="font-size:14px;color:#555;line-height:1.7;margin:0">关键风险提示、不可忽略的注意事项放在这里。</p>\n</section>`},
  {id:'t14',cat:'列表',name:'要点列表',html:`<section style="margin:10px 0">\n  <div style="display:flex;align-items:flex-start;padding:8px 0;border-bottom:1px solid #f5f5f5"><span style="color:${A};font-weight:bold;margin-right:10px;flex-shrink:0;font-size:18px;line-height:1.3">●</span><p style="font-size:15px;color:#333;line-height:1.8;margin:0">要点一：内容放在这里</p></div>\n  <div style="display:flex;align-items:flex-start;padding:8px 0;border-bottom:1px solid #f5f5f5"><span style="color:${A};font-weight:bold;margin-right:10px;flex-shrink:0;font-size:18px;line-height:1.3">●</span><p style="font-size:15px;color:#333;line-height:1.8;margin:0">要点二：内容放在这里</p></div>\n  <div style="display:flex;align-items:flex-start;padding:8px 0"><span style="color:${A};font-weight:bold;margin-right:10px;flex-shrink:0;font-size:18px;line-height:1.3">●</span><p style="font-size:15px;color:#333;line-height:1.8;margin:0">要点三：内容放在这里</p></div>\n</section>`},
  {id:'t15',cat:'列表',name:'步骤列表',html:`<section style="margin:10px 0">\n  <div style="display:flex;align-items:flex-start;margin-bottom:14px"><span style="flex-shrink:0;width:26px;height:26px;background:${A};color:#fff;border-radius:50%;font-size:13px;text-align:center;line-height:26px;margin-right:12px;margin-top:2px;font-weight:bold">1</span><div><p style="font-size:15px;font-weight:bold;color:#1a1a1a;margin:0 0 3px 0">第一步标题</p><p style="font-size:13px;color:#666;line-height:1.7;margin:0">说明。</p></div></div>\n  <div style="display:flex;align-items:flex-start;margin-bottom:14px"><span style="flex-shrink:0;width:26px;height:26px;background:${A};color:#fff;border-radius:50%;font-size:13px;text-align:center;line-height:26px;margin-right:12px;margin-top:2px;font-weight:bold">2</span><div><p style="font-size:15px;font-weight:bold;color:#1a1a1a;margin:0 0 3px 0">第二步标题</p><p style="font-size:13px;color:#666;line-height:1.7;margin:0">说明。</p></div></div>\n  <div style="display:flex;align-items:flex-start"><span style="flex-shrink:0;width:26px;height:26px;background:${A};color:#fff;border-radius:50%;font-size:13px;text-align:center;line-height:26px;margin-right:12px;margin-top:2px;font-weight:bold">3</span><div><p style="font-size:15px;font-weight:bold;color:#1a1a1a;margin:0 0 3px 0">第三步标题</p><p style="font-size:13px;color:#666;line-height:1.7;margin:0">说明。</p></div></div>\n</section>`},
  {id:'t16',cat:'数据',name:'数据亮点',html:`<section style="display:flex;justify-content:space-around;flex-wrap:wrap;margin:20px 0;padding:16px 0;border-top:1px solid #f0f0f0;border-bottom:1px solid #f0f0f0">\n  <div style="text-align:center;padding:8px 14px"><p style="font-size:34px;font-weight:bold;color:${A};margin:0;line-height:1">95%</p><p style="font-size:12px;color:#999;margin:6px 0 0">用户满意度</p></div>\n  <div style="text-align:center;padding:8px 14px"><p style="font-size:34px;font-weight:bold;color:${A};margin:0;line-height:1">10x</p><p style="font-size:12px;color:#999;margin:6px 0 0">效率提升</p></div>\n  <div style="text-align:center;padding:8px 14px"><p style="font-size:34px;font-weight:bold;color:${A};margin:0;line-height:1">3天</p><p style="font-size:12px;color:#999;margin:6px 0 0">快速上手</p></div>\n</section>`},
  {id:'t17',cat:'数据',name:'核心观点卡',html:`<section style="margin:20px 0;padding:22px 16px;background:#FFF8EC;border-radius:8px;text-align:center">\n  <p style="font-size:12px;color:${A};font-weight:bold;letter-spacing:2px;margin:0 0 10px 0">— 核心结论 —</p>\n  <p style="font-size:17px;color:#1a1a1a;line-height:1.7;font-weight:bold;margin:0">文章最重要的一句话放在这里，让读者截图转发。</p>\n</section>`},
  {id:'t18',cat:'数据',name:'两栏对比',html:`<section style="display:flex;gap:10px;margin:18px 0">\n  <div style="flex:1;padding:14px;background:#fff3cd;border-radius:6px;border-top:3px solid #ffc107"><p style="font-size:13px;font-weight:bold;color:#856404;margin:0 0 7px 0">❌ 不好的做法</p><p style="font-size:13px;color:#666;line-height:1.7;margin:0">描述错误或低效的做法。</p></div>\n  <div style="flex:1;padding:14px;background:#f2e0d0;border-radius:6px;border-top:3px solid ${A}"><p style="font-size:13px;font-weight:bold;color:#70381a;margin:0 0 7px 0">✅ 正确的做法</p><p style="font-size:13px;color:#444;line-height:1.7;margin:0">描述正确高效的做法。</p></div>\n</section>`},
  {id:'t19',cat:'分隔',name:'虚线分隔',html:`<p style="text-align:center;font-size:13px;color:#ccc;margin:24px 0;letter-spacing:8px">· · · · ·</p>`},
  {id:'t20',cat:'收尾',name:'文章结尾',html:`<section style="margin-top:32px;padding:22px 14px;text-align:center;border-top:2px solid ${A}">\n  <p style="font-size:15px;color:#666;margin:0 0 6px 0">— END —</p>\n  <p style="font-size:14px;color:#999;margin:0">如果对你有帮助，欢迎点击「在看」和「分享」👇</p>\n</section>`},
];

const TM_CATS=['全部','结构','文字','引用','提示框','列表','数据','分隔','收尾'];
let tmCat='全部';

function buildTmCats(){
  const row=document.getElementById('tm-cats');row.innerHTML='';
  TM_CATS.forEach(c=>{
    const b=document.createElement('span');
    b.className='tm-cat'+(c===tmCat?' active':'');
    b.textContent=c;
    b.onclick=()=>{tmCat=c;buildTmCats();buildTmGrid();};
    row.appendChild(b);
  });
}

function buildTmGrid(){
  const filtered=tmCat==='全部'?TEMPLATES:TEMPLATES.filter(t=>t.cat===tmCat);
  const grid=document.getElementById('tm-grid');grid.innerHTML='';
  filtered.forEach(t=>{
    const card=document.createElement('div');card.className='tm-card';
    card.innerHTML=`<div class="tm-card-head"><div style="display:flex;align-items:center;gap:6px"><span class="tm-label">${t.cat}</span><span class="tm-name">${t.name}</span></div><div style="display:flex;gap:4px"><button class="tm-copy" data-html="${encodeURIComponent(t.html)}" data-action="format">→排版</button><button class="tm-copy" data-html="${encodeURIComponent(t.html)}" data-action="copy">复制</button></div></div><div class="tm-card-preview">${t.html}</div><div class="tm-card-code"><pre>${t.html.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></div>`;
    grid.appendChild(card);
  });
  grid.querySelectorAll('.tm-copy').forEach(btn=>{
    btn.addEventListener('click',function(){
      const html=decodeURIComponent(this.dataset.html);
      if(this.dataset.action==='format'){
        document.getElementById('preview').innerHTML=html;
        document.getElementById('md-input').value='';
        switchTab('format');showToast('模板已发送到排版，可预览或一键同步',true);
      }else{
        navigator.clipboard.writeText(html).then(()=>{this.textContent='✓ 已复制';this.classList.add('done');setTimeout(()=>{this.textContent='复制';this.classList.remove('done');},2000);}).catch(()=>showToast('复制失败',false));
      }
    });
  });
}

async function doSmartFormat(){
  const draft=document.getElementById('draft-input').value.trim();
  const resultText=document.getElementById('result-output').value.trim();
  const article=resultText||draft;
  if(!article){showToast('请先输入或改写文章内容',false);return;}
  const btn=document.getElementById('smart-format-btn'),resultArea=document.getElementById('result-output');
  btn.disabled=true;btn.textContent='⏳ 智能排版中...';resultArea.value='';
  const tmRef=TEMPLATES.map(t=>`- ${t.name}（${t.cat}）`).join('\n');
  const systemPrompt=`你是公众号排版专家。将用户文章转为排版精良的 HTML。可用模板卡片类型：${tmRef}\n格式规范：主题色 #C96B3D，背景 #FAF8F6，正文 #333，字号 15-17px，行高 1.9-2.0。标题栏居中、二级标题左边框 accent 色、数据亮点三栏居中数字、核心观点卡 accent 背景居中大字、提示框带图标+彩色背景分暖/黄/蓝/红、引用块左边框+浅色背景、步骤列表圆形编号、两栏对比左右分栏。所有标签用 section/p/blockquote/table/strong/span，禁用 div/pre/max-width/box-shadow/overflow。保持原文内容不变只增强版式。直接输出纯 HTML 不加代码块标记。`;
  try{
    const config=await getAPIConfig();
    if(!config.apiKey)throw new Error('请先配置 API Key（点击 ⚙️）');
    const base=config.apiBaseUrl.replace(/\/+$/,'');
    const resp=await fetch(base+'/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+config.apiKey},
      body:JSON.stringify({model:config.model,messages:[{role:'system',content:systemPrompt},{role:'user',content:article}],temperature:parseFloat(config.temperature)||0.7,max_tokens:16384})
    });
    if(!resp.ok){let detail='';try{const d=await resp.json();detail=': '+(d.error?.message||JSON.stringify(d));}catch(e){}throw new Error('API 错误 ('+resp.status+')'+detail);}
    const data=await resp.json();
    const content=data.choices?.[0]?.message?.content;
    if(!content){const reason=data.choices?.[0]?.finish_reason||'unknown';throw new Error('模型返回空（finish_reason='+reason+'），可能是内容过长被截断');}
    resultArea.value=content.trim();
    document.getElementById('retry-btn').disabled=false;
    document.getElementById('copy-result-btn').disabled=false;
    document.getElementById('send-to-format-btn').disabled=false;
    showToast('智能排版完成',true);
  }catch(e){resultArea.value='❌ '+e.message;showToast(e.message,false);}
  btn.disabled=false;btn.textContent='🎨 智能排版';
}

// ============================================================
// 风格选择 & 设置
// ============================================================
function buildStyleSelect(){
  const sel=document.getElementById('style-select');
  Object.entries(STYLE_PRESETS).forEach(([key,val])=>{const opt=document.createElement('option');opt.value=key;opt.textContent=val.label;if(key===currentStyle)opt.selected=true;sel.appendChild(opt);});
  updateCustomPrompt();
}

function updateCustomPrompt(){
  const key=document.getElementById('style-select').value;
  const box=document.getElementById('custom-prompt-box'),ta=box.querySelector('textarea');
  if(key==='custom'){box.classList.add('show');if(!ta.value)ta.value='';ta.placeholder='在此输入自定义 system prompt...';}
  else{box.classList.remove('show');ta.value=STYLE_PRESETS[key]?.prompt||'';}
}

async function loadSettings(){
  try{if(!chrome.storage){showToast('chrome.storage 不可用，请检查扩展权限',false);return;}
    const config=await getAPIConfig();
    document.getElementById('cfg-url').value=config.apiBaseUrl;
    document.getElementById('cfg-key').value=config.apiKey;
    document.getElementById('cfg-model').value=config.model;
    document.getElementById('cfg-temperature').value=config.temperature||'0.7';
  }catch(e){showToast('加载配置失败：'+e.message,false);}
}

function saveSettings(){
  showToast('正在保存...',true);
  if(typeof chrome==='undefined'||!chrome.storage||!chrome.storage.local){showToast('chrome.storage 不可用。请移除扩展后重新加载',false);return;}
  const data={apiBaseUrl:document.getElementById('cfg-url').value.trim()||'https://api.deepseek.com/v1',apiKey:document.getElementById('cfg-key').value.trim(),model:document.getElementById('cfg-model').value.trim()||'deepseek-chat',temperature:document.getElementById('cfg-temperature').value.trim()||'0.7'};
  chrome.storage.local.set(data,()=>{const err=chrome.runtime.lastError;if(err){showToast('保存失败：'+err.message,false);return;}document.getElementById('settings-panel').classList.remove('show');showToast('API 配置已保存 ✓',true);});
}

function resetSettings(){document.getElementById('cfg-url').value='https://api.deepseek.com/v1';document.getElementById('cfg-key').value='';document.getElementById('cfg-model').value='deepseek-chat';document.getElementById('cfg-temperature').value='0.7';}

// ============================================================
// 启动
// ============================================================
function init(){
  document.getElementById('md-input').value=`# 我为什么非得把整本书重写\n\n四月那本，基于的是 Hermes v0.7.0。现在它已经到 v0.16.0 了。\n\n这两个月它长出来的东西，我列一下你感受：\n\n- 原生桌面 App、浏览器管理面板\n- 简体中文支持、23 个消息平台接入\n- 一群 Agent 协同干活的多 Agent 看板\n- 一套认真写过的安全模型\n\n官方自己把这一版命名为 **「The Surface Release」**，意思就是让你在任何地方都摸得到它。\n\n> GitHub 简介从过去的「self-improving」换成了「The agent that grows with you」。\n\n一个会自己改自己的 Agent，边界到底在哪，谁来看着它？`;
  buildThemeBar();render();buildStyleSelect();loadSettings();buildTmCats();buildTmGrid();
  document.getElementById('md-input').addEventListener('input',render);
  document.getElementById('sync-btn').addEventListener('click',syncToWechat);
  document.getElementById('copy-btn').addEventListener('click',copyToClipboard);
  document.querySelectorAll('.tab').forEach(tab=>{tab.addEventListener('click',()=>switchTab(tab.dataset.tab));});
  document.getElementById('rewrite-btn').addEventListener('click',doRewrite);
  document.getElementById('smart-format-btn').addEventListener('click',doSmartFormat);
  document.getElementById('style-select').addEventListener('change',()=>{currentStyle=document.getElementById('style-select').value;updateCustomPrompt();});
  document.getElementById('custom-toggle').addEventListener('click',()=>{document.getElementById('custom-prompt-box').classList.toggle('show');});
  document.getElementById('retry-btn').addEventListener('click',doRewrite);
  document.getElementById('copy-result-btn').addEventListener('click',()=>{const r=document.getElementById('result-output').value;if(!r)return;navigator.clipboard.writeText(r).then(()=>showToast('已复制改写结果',true),()=>showToast('复制失败',false));});
  document.getElementById('send-to-format-btn').addEventListener('click',()=>{const result=document.getElementById('result-output').value;if(!result)return;const isHtml=/<\/?[a-z][\s\S]*>/i.test(result)||result.trim().startsWith('<!');if(isHtml){document.getElementById('preview').innerHTML=result;document.getElementById('md-input').value='';}else{document.getElementById('md-input').value=result;render();}switchTab('format');showToast('已发送到排版，可预览和同步',true);});
  document.getElementById('gear-btn').addEventListener('click',()=>{document.getElementById('settings-panel').classList.toggle('show');if(document.getElementById('settings-panel').classList.contains('show'))loadSettings();});
  document.getElementById('cfg-save').addEventListener('click',saveSettings);
  document.getElementById('cfg-reset').addEventListener('click',resetSettings);
}
init();
