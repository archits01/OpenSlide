 "use client";

import { forwardRef, useImperativeHandle, useMemo, useState, useRef, useEffect, useCallback } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, CopyCheckIcon, TextBoldIcon, TextItalicIcon, TextUnderlineIcon, TextStrikethroughIcon, TextAlignLeftIcon, TextAlignCenterIcon, TextAlignRightIcon, TextAlignJustifyLeftIcon, Delete02Icon, LetterSpacingIcon, LeftToRightListBulletIcon, LeftToRightListNumberIcon, UndoIcon, RedoIcon, Link01Icon, TextIndentMoreIcon, TextIndentLessIcon, CleanIcon, PaintBucketIcon, ColorPickerIcon, CheckListIcon, ArrowDown01Icon, MessageAdd01Icon } from "@hugeicons/core-free-icons";
import { motion, AnimatePresence } from "framer-motion";
import type { Slide } from "@/lib/redis";
import type { ThemeName, ThemeColors, LogoResult } from "@/lib/slide-html";
import { RegenerateButton } from "./RegeneratePopover";
import { buildSlideHtml } from "@/lib/slide-html";

export { buildSlideHtml };

// ─── Bridge script ─────────────────────────────────────────────────────────────
// Injected into slide iframes when entering edit mode.
// Tracks undo history for move/resize/style operations.
// Text editing undo is handled natively by the browser's contentEditable.
const BRIDGE_SCRIPT = `<script>(function(){
var SKIP_TAG=new Set(['SCRIPT','STYLE','META','LINK','HEAD','HTML','NOSCRIPT','BR','HR','INPUT','TEXTAREA','SELECT','CANVAS','VIDEO','AUDIO','OBJECT','EMBED']);
var INLINE=new Set(['SPAN','A','STRONG','EM','B','I','U','SMALL','MARK','SUB','SUP','LABEL','ABBR','CITE','CODE','KBD','Q','S','TIME','VAR','WBR','FONT']);
var counter=0;
function nextId(p){counter++;return p+counter;}
function positionedAnchor(el){var p=el.parentElement;while(p&&p!==document.body){var pos=window.getComputedStyle(p).position;if(pos!=='static')return p;p=p.parentElement;}return document.body;}
function trueOffset(el){var anchor=positionedAnchor(el);var er=el.getBoundingClientRect();var ar=anchor.getBoundingClientRect();return{x:Math.round(er.left-ar.left),y:Math.round(er.top-ar.top),w:Math.round(er.width),h:Math.round(er.height)};}
function shouldTag(el){if(SKIP_TAG.has(el.tagName))return false;if((el.innerText||'').trim()==='')return false;var blockKids=Array.from(el.children).filter(function(k){return!SKIP_TAG.has(k.tagName)&&!INLINE.has(k.tagName);});return blockKids.length===0;}
function wrapBareTextNodes(){var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode:function(node){var txt=(node.nodeValue||'').trim();if(!txt)return NodeFilter.FILTER_REJECT;var p=node.parentElement;if(!p||SKIP_TAG.has(p.tagName))return NodeFilter.FILTER_REJECT;if(shouldTag(p))return NodeFilter.FILTER_REJECT;return NodeFilter.FILTER_ACCEPT;}});var nodes=[],n;while((n=walker.nextNode()))nodes.push(n);nodes.forEach(function(node){var span=document.createElement('span');span.dataset.eid=nextId('t');span.dataset.etype='text';span.dataset.bareWrapped='1';node.parentNode.replaceChild(span,node);span.appendChild(node);});}
function tagElements(){document.querySelectorAll('*').forEach(function(el){if(el.dataset&&el.dataset.eid)return;if(el.tagName==='IMG'){el.dataset.eid=nextId('img');el.dataset.etype='img';return;}if(shouldTag(el)){el.dataset.eid=nextId('e');el.dataset.etype='text';}});}
wrapBareTextNodes();tagElements();
var st=document.createElement('style');
st.textContent='[data-eid][data-etype="text"]:hover{outline:2px dashed rgba(16,185,129,0.6)!important;outline-offset:2px;cursor:text;}[data-eid][data-etype="img"]:hover{outline:2px dashed rgba(245,158,11,0.7)!important;cursor:pointer;}[data-eid].esel{outline:none!important;}.__ghost{visibility:hidden;pointer-events:none;flex-shrink:0;}';
document.head.appendChild(st);
function freezeInPlace(el){if(el.dataset.frozen==='1')return;var er=el.getBoundingClientRect();var w=el.offsetWidth,h=el.offsetHeight;var disp=window.getComputedStyle(el).display;var ghost=document.createElement('div');ghost.className='__ghost';ghost.style.width=w+'px';ghost.style.height=h+'px';ghost.style.display=(disp==='inline'||disp==='inline-block'||disp==='inline-flex')?'inline-block':disp;ghost.dataset.ghostFor=el.dataset.eid;el.parentNode.insertBefore(ghost,el);el.style.position='absolute';el.style.margin='0';el.style.width=w+'px';var op=el.offsetParent||document.body;var opR=op.getBoundingClientRect();el.style.left=Math.round(er.left-opR.left)+'px';el.style.top=Math.round(er.top-opR.top)+'px';el.dataset.frozen='1';}
var selId=null;
var _hist=[];var _redo=[];var _hasTextChanges=false;var _textHist=[];var _pendingSnap=null;
function broadcastHist(){window.parent.postMessage({type:'histstate',canUndo:_hist.length>0||_hasTextChanges,canRedo:_redo.length>0},'*');}
function selectEl(el){if(selId&&selId!==el.dataset.eid){var old=document.querySelector('[data-eid="'+selId+'"]');if(old){old.classList.remove('esel');old.contentEditable='false';}}selId=el.dataset.eid;el.classList.add('esel');if(el.dataset.etype!=='img'){el.contentEditable='true';el.focus();}var cs=window.getComputedStyle(el);var ap=trueOffset(el);var info={type:'select',id:selId,etype:el.dataset.etype||'text',rect:ap,styles:{fontSize:cs.fontSize,color:cs.color,fontWeight:cs.fontWeight,fontStyle:cs.fontStyle,textAlign:cs.textAlign,textDecoration:cs.textDecoration,letterSpacing:cs.letterSpacing,lineHeight:cs.lineHeight,fontFamily:cs.fontFamily,backgroundColor:cs.backgroundColor,opacity:cs.opacity,objectFit:cs.objectFit,borderRadius:cs.borderRadius}};if(el.dataset.etype==='img')info.src=el.src;else info.text=el.innerText;window.parent.postMessage(info,'*');}
function deselectAll(){if(selId){var old=document.querySelector('[data-eid="'+selId+'"]');if(old){old.classList.remove('esel');old.contentEditable='false';}}selId=null;window.parent.postMessage({type:'deselect'},'*');}
document.addEventListener('click',function(ev){var t=ev.target;while(t&&t!==document.body){if(t.dataset&&t.dataset.eid){ev.stopPropagation();selectEl(t);return;}t=t.parentElement;}deselectAll();},true);
document.addEventListener('input',function(ev){var t=ev.target;if(t.dataset&&t.dataset.eid&&t.contentEditable==='true'){if(_pendingSnap&&_pendingSnap.eid===t.dataset.eid){_textHist.push(_pendingSnap);if(_textHist.length>50)_textHist.shift();_pendingSnap=null;_hasTextChanges=true;broadcastHist();}window.parent.postMessage({type:'textchange',id:t.dataset.eid,text:t.innerText},'*');window.parent.postMessage({type:'rectback',id:t.dataset.eid,rect:trueOffset(t)},'*');}});
document.addEventListener('keydown',function(ev){if(ev.key==='Escape'){deselectAll();return;}var t=ev.target;if(t.dataset&&t.dataset.eid&&t.contentEditable==='true'){_pendingSnap={eid:t.dataset.eid,html:t.innerHTML};}});
window.addEventListener('message',function(e){var d=e.data;if(!d||!d.type)return;
if(d.type==='style'){
  var el=document.querySelector('[data-eid="'+d.id+'"]');
  if(el){_hist.push({type:'style',eid:d.id,prev:{prop:d.prop,val:el.style[d.prop]||''},next:{prop:d.prop,val:d.val}});_redo=[];el.style[d.prop]=d.val;broadcastHist();}
}
if(d.type==='src'){var el=document.querySelector('[data-eid="'+d.id+'"]');if(el)el.src=d.val;}
if(d.type==='move'){
  var el=document.querySelector('[data-eid="'+d.id+'"]');if(!el)return;
  el.contentEditable='false';
  var prev=el.dataset.frozen==='1'?{x:parseFloat(el.style.left)||0,y:parseFloat(el.style.top)||0,w:el.offsetWidth,h:el.offsetHeight}:trueOffset(el);
  _hist.push({type:'move',eid:d.id,prev:prev,next:{x:d.x,y:d.y}});_redo=[];
  freezeInPlace(el);el.style.left=d.x+'px';el.style.top=d.y+'px';broadcastHist();
}
if(d.type==='resize'){
  var el=document.querySelector('[data-eid="'+d.id+'"]');if(!el)return;
  el.contentEditable='false';
  _hist.push({type:'resize',eid:d.id,prev:{x:parseFloat(el.style.left)||0,y:parseFloat(el.style.top)||0,w:el.offsetWidth,h:el.offsetHeight},next:{x:d.x,y:d.y,w:d.w,h:d.h}});_redo=[];
  freezeInPlace(el);
  if(d.w!=null)el.style.width=d.w+'px';if(d.h!=null)el.style.height=d.h+'px';
  if(d.x!=null)el.style.left=d.x+'px';if(d.y!=null)el.style.top=d.y+'px';broadcastHist();
}
if(d.type==='rect'){
  var el=document.querySelector('[data-eid="'+d.id+'"]');
  if(el)window.parent.postMessage({type:'rectback',id:d.id,rect:trueOffset(el)},'*');
}
if(d.type==='delete'){
  var el=document.querySelector('[data-eid="'+d.id+'"]');
  if(el){var ghost=document.querySelector('[data-ghost-for="'+d.id+'"]');if(ghost)ghost.remove();el.remove();}
  deselectAll();
}
if(d.type==='undo'){
  var h=_hist.pop();
  if(h){
    var el=document.querySelector('[data-eid="'+h.eid+'"]');
    if(el){
      _redo.push(h);
      if(h.type==='move'){
        el.style.left=h.prev.x+'px';el.style.top=h.prev.y+'px';
        if(selId===h.eid)window.parent.postMessage({type:'rectback',id:h.eid,rect:trueOffset(el)},'*');
      }
      if(h.type==='resize'){
        el.style.left=h.prev.x+'px';el.style.top=h.prev.y+'px';
        el.style.width=h.prev.w+'px';el.style.height=h.prev.h+'px';
        if(selId===h.eid)window.parent.postMessage({type:'rectback',id:h.eid,rect:trueOffset(el)},'*');
      }
      if(h.type==='style'){el.style[h.prev.prop]=h.prev.val;}
      broadcastHist();
    }
  } else if(_hasTextChanges&&_textHist.length>0){
    var te=_textHist.pop();
    var tel=document.querySelector('[data-eid="'+te.eid+'"]');
    if(tel){
      tel.innerHTML=te.html;
      try{var rng=document.createRange();var sel=window.getSelection();rng.selectNodeContents(tel);rng.collapse(false);sel.removeAllRanges();sel.addRange(rng);}catch(e){}
      window.parent.postMessage({type:'textchange',id:te.eid,text:tel.innerText},'*');
    }
    if(_textHist.length===0)_hasTextChanges=false;
    broadcastHist();
  }
}
if(d.type==='redo'){
  var h=_redo.pop();if(!h)return;
  var el=document.querySelector('[data-eid="'+h.eid+'"]');if(!el)return;
  _hist.push(h);
  if(h.type==='move'){
    el.style.left=h.next.x+'px';el.style.top=h.next.y+'px';
    if(selId===h.eid)window.parent.postMessage({type:'rectback',id:h.eid,rect:trueOffset(el)},'*');
  }
  if(h.type==='resize'){
    if(h.next.w!=null)el.style.width=h.next.w+'px';if(h.next.h!=null)el.style.height=h.next.h+'px';
    if(h.next.x!=null)el.style.left=h.next.x+'px';if(h.next.y!=null)el.style.top=h.next.y+'px';
    if(selId===h.eid)window.parent.postMessage({type:'rectback',id:h.eid,rect:trueOffset(el)},'*');
  }
  if(h.type==='style'){el.style[h.next.prop]=h.next.val;}
  broadcastHist();
}
if(d.type==='getHTML'){
  deselectAll();
  document.querySelectorAll('.__ghost').forEach(function(g){g.remove();});
  document.querySelectorAll('[data-eid]').forEach(function(el){
    el.classList.remove('esel');el.contentEditable='false';delete el.dataset.frozen;
    if(el.dataset.bareWrapped==='1'&&el.childNodes.length===1&&el.childNodes[0].nodeType===3){
      el.parentNode.replaceChild(el.childNodes[0].cloneNode(),el);
    }
  });
  window.parent.postMessage({type:'html',html:document.documentElement.outerHTML},'*');
}
});
})();<\/script>`;

// ─── Doc bridge script ─────────────────────────────────────────────────────────
// Simpler than BRIDGE_SCRIPT — makes the entire body contentEditable and
// handles formatting commands from the parent DocFormatBar via postMessage.
// Also includes paste normalization (strip external formatting) and link helpers.
const DOC_BRIDGE_SCRIPT = `<script>(function(){
document.body.contentEditable='true';
document.body.style.outline='none';
document.body.style.caretColor='#4338CA';
var savedRange=null;
function qs(cmd){try{return document.queryCommandState(cmd);}catch(e){return false;}}
function qv(cmd){try{return document.queryCommandValue(cmd)||'';}catch(e){return '';}}
function sendState(){
  var align='left';
  if(qs('justifyCenter'))align='center';
  else if(qs('justifyRight'))align='right';
  else if(qs('justifyFull'))align='justify';
  var block=(qv('formatBlock')).toLowerCase().replace(/[<>]/g,'');
  var sel=window.getSelection(),inLink=false;
  if(sel&&sel.rangeCount>0){var node=sel.getRangeAt(0).commonAncestorContainer;if(node.nodeType===3)node=node.parentNode;while(node&&node!==document.body){if(node.tagName==='A'){inLink=true;break;}node=node.parentNode;}}
  window.parent.postMessage({type:'docSelState',bold:qs('bold'),italic:qs('italic'),underline:qs('underline'),strike:qs('strikeThrough'),ul:qs('insertUnorderedList'),ol:qs('insertOrderedList'),align:align,block:block||'p',fontSize:qv('fontSize')||'3',foreColor:qv('foreColor')||'',fontName:qv('fontName')||'',inLink:inLink},'*');
}
document.addEventListener('selectionchange',sendState);
document.addEventListener('keyup',sendState);
document.addEventListener('mouseup',sendState);
document.addEventListener('paste',function(e){
  e.preventDefault();
  var html=e.clipboardData.getData('text/html');
  if(!html){document.execCommand('insertText',false,e.clipboardData.getData('text/plain')||'');return;}
  var doc=(new DOMParser()).parseFromString(html,'text/html');
  var ALLOW=new Set(['P','H1','H2','H3','H4','STRONG','EM','B','I','U','S','A','UL','OL','LI','BR','IMG','TABLE','THEAD','TBODY','TR','TH','TD','BLOCKQUOTE','PRE','CODE','SUB','SUP']);
  var ATTRS={A:['href'],IMG:['src','alt']};
  function clean(el){Array.from(el.childNodes).forEach(function(n){if(n.nodeType===3)return;if(n.nodeType!==1){n.parentNode.removeChild(n);return;}if(!ALLOW.has(n.tagName)){while(n.firstChild)el.insertBefore(n.firstChild,n);el.removeChild(n);return;}Array.from(n.attributes).forEach(function(a){if(!(ATTRS[n.tagName]||[]).includes(a.name))n.removeAttribute(a.name);});clean(n);});}
  clean(doc.body);
  document.execCommand('insertHTML',false,doc.body.innerHTML);
});
window.addEventListener('message',function(e){
  var d=e.data;if(!d||!d.type)return;
  if(d.type==='docExec'){
    try{document.execCommand(d.cmd,false,d.val!=null?d.val:null);}catch(ex){}
    sendState();
  }
  if(d.type==='saveSelection'){
    var s=window.getSelection();
    savedRange=s&&s.rangeCount>0?s.getRangeAt(0).cloneRange():null;
  }
  if(d.type==='applyLink'){
    if(savedRange){var s=window.getSelection();s.removeAllRanges();s.addRange(savedRange);}
    if(d.url){
      var sel=window.getSelection();
      if(d.text&&(!sel||sel.isCollapsed)){document.execCommand('insertHTML',false,'<a href="'+d.url+'">'+d.text+'</a>');}
      else{document.execCommand('createLink',false,d.url);}
    }else{document.execCommand('unlink',false,null);}
    savedRange=null;sendState();
  }
  if(d.type==='insertImage'){
    var img='<img src="'+d.src+'" alt="" style="max-width:100%;height:auto;border-radius:4px;margin:8px 0;display:block;" />';
    document.execCommand('insertHTML',false,img);
  }
  if(d.type==='insertTable'){
    var r=d.rows||3,c=d.cols||3;var h='<table style="width:100%;border-collapse:collapse;margin:12px 0;"><thead><tr>';
    for(var i=0;i<c;i++)h+='<th style="border:1px solid #d1d5db;padding:8px 12px;text-align:left;font-weight:600;background:#f3f4f6;">Header</th>';
    h+='</tr></thead><tbody>';
    for(var j=1;j<r;j++){h+='<tr>';for(var k=0;k<c;k++)h+='<td style="border:1px solid #d1d5db;padding:8px 12px;">Cell</td>';h+='</tr>';}
    h+='</tbody></table>';document.execCommand('insertHTML',false,h);
  }
  if(d.type==='insertChecklist'){
    var items=d.count||3;var h='<div style="margin:8px 0;">';
    for(var i=0;i<items;i++)h+='<div style="display:flex;align-items:flex-start;gap:8px;padding:4px 0;"><input type="checkbox" style="margin-top:3px;accent-color:#4338CA;width:16px;height:16px;flex-shrink:0;" /><span contenteditable="true">Item '+(i+1)+'</span></div>';
    h+='</div>';document.execCommand('insertHTML',false,h);
  }
  if(d.type==='getHTML'){
    document.querySelectorAll('script').forEach(function(s){s.remove();});
    document.body.contentEditable='false';
    window.parent.postMessage({type:'html',html:document.documentElement.outerHTML},'*');
  }
});
window.parent.postMessage({type:'docReady'},'*');
})();<\/script>`;

// ─── HTML syntax highlighter ───────────────────────────────────────────────────
function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function colorizeAttrs(attrs: string): string {
  return attrs.replace(
    /([a-zA-Z][a-zA-Z0-9_:-]*)(\s*=\s*)("([^"]*)"|'([^']*)')/g,
    (_, name, eq, val) =>
      `<span style="color:#2563EB">${esc(name)}</span><span style="color:#71717A">${esc(eq)}</span><span style="color:#16A34A">${esc(val)}</span>`
  ).replace(
    /(?<==\s*["'][^"']*["']|^|\s)([a-zA-Z][a-zA-Z0-9_:-]*)(?=\s|$|>|\/)/g,
    (match, name) => match.startsWith('=') ? match : `<span style="color:#2563EB">${esc(name)}</span>`
  );
}

function highlightHtml(html: string): string {
  const parts = html.split(/(<(?:[^"'<>]|"[^"]*"|'[^']*')*>)/g);
  return parts.map(part => {
    if (!part.startsWith("<")) return esc(part);
    if (part.startsWith("<!--")) return `<span style="color:#A1A1AA;font-style:italic">${esc(part)}</span>`;
    if (part.startsWith("<!")) return `<span style="color:#7C3AED">${esc(part)}</span>`;
    if (part.startsWith("</")) {
      const name = part.slice(2).replace(/[\s>].*/, "");
      return `<span style="color:#71717A">&lt;/</span><span style="color:#DC2626">${esc(name)}</span><span style="color:#71717A">&gt;</span>`;
    }
    const selfClose = part.endsWith("/>");
    const inner = selfClose ? part.slice(1, -2) : part.slice(1, -1);
    const spaceIdx = inner.search(/[\s/]/);
    const tagName = spaceIdx === -1 ? inner : inner.slice(0, spaceIdx);
    const rest = spaceIdx === -1 ? "" : inner.slice(spaceIdx);
    const close = selfClose ? "/&gt;" : "&gt;";
    return `<span style="color:#71717A">&lt;</span><span style="color:#DC2626">${esc(tagName)}</span>${colorizeAttrs(rest)}<span style="color:#71717A">${close}</span>`;
  }).join("");
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface SlideCanvasHandle {
  saveAll: () => void;
  undoInEdit: () => void;
  redoInEdit: () => void;
}

interface BuildingSlideData {
  toolUseId: string;
  title?: string;
  partialContent: string;
}

interface SlideCanvasProps {
  slides: Slide[];
  theme: ThemeName;
  logoResult?: LogoResult | null;
  themeColors?: ThemeColors;
  sessionType?: "slides" | "docs" | "sheets" | "website";
  isEditMode?: boolean;
  onActiveSlideChange?: (id: string) => void;
  onSlidesEdited?: (updates: Array<{ id: string; content: string }>) => void;
  onAddToChat?: (text: string) => void;
  onAttachSlide?: (slide: Slide) => void;
  buildingSlide?: BuildingSlideData | null;
  onEditHistChange?: (canUndo: boolean, canRedo: boolean) => void;
  onRegenerate?: (slide: Slide, reasonCode: string, freeText?: string) => void;
}

interface SelState {
  id: string;
  etype: string;
  rect: { x: number; y: number; w: number; h: number };
  styles: Record<string, string>;
  text?: string;
}

type CaptureState =
  | { kind: "drag"; mx: number; my: number; bx: number; by: number }
  | { kind: "resize"; dir: string; mx: number; my: number; bx: number; by: number; bw: number; bh: number }
  | null;

// ─── Toolbar shared styles ────────────────────────────────────────────────────

const tbBtnBase: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 7, border: "none",
  background: "transparent", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center",
  transition: "background 150ms, color 150ms",
  fontSize: 13, fontWeight: 500,
};

const dropdownStyle: React.CSSProperties = {
  position: "absolute", top: "calc(100% + 6px)", left: 0,
  background: "var(--bg)", borderRadius: 10,
  border: "1px solid var(--border)",
  boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
  padding: "4px", zIndex: 100, minWidth: 140,
};

const dropItemStyle: React.CSSProperties = {
  width: "100%", display: "flex", alignItems: "center", gap: 8,
  padding: "7px 10px", borderRadius: 7,
  border: "none", background: "transparent",
  fontSize: 13, color: "var(--text)", cursor: "pointer",
  transition: "background 100ms",
  textAlign: "left",
};

function TbDivider() {
  return <div style={{ width: 1, height: 20, background: "var(--border)", margin: "0 2px", flexShrink: 0 }} />;
}

function TbDropdown({ open, style, alignRight, children }: { open: boolean; style?: React.CSSProperties; alignRight?: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.96 }}
          transition={{ type: "spring", damping: 25, stiffness: 400 }}
          style={{ ...dropdownStyle, ...(alignRight ? { left: "auto", right: 0 } : {}), ...style }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── DocFormatBar ─────────────────────────────────────────────────────────────

interface DocSelState {
  bold: boolean; italic: boolean; underline: boolean; strike: boolean;
  ul: boolean; ol: boolean; align: string; block: string;
  fontSize: string; foreColor: string; fontName: string; inLink: boolean;
}

const FONT_FAMILIES = [
  { val: "Inter", label: "Inter" },
  { val: "Arial", label: "Arial" },
  { val: "Helvetica", label: "Helvetica" },
  { val: "Georgia", label: "Georgia" },
  { val: "Times New Roman", label: "Times New Roman" },
  { val: "Garamond", label: "Garamond" },
  { val: "Verdana", label: "Verdana" },
  { val: "Trebuchet MS", label: "Trebuchet MS" },
  { val: "Tahoma", label: "Tahoma" },
  { val: "Palatino Linotype", label: "Palatino" },
  { val: "Courier New", label: "Courier New" },
  { val: "Lucida Console", label: "Lucida Console" },
];

const FONT_COLORS = [
  "#000000", "#374151", "#6B7280", "#DC2626", "#F97316",
  "#EAB308", "#16A34A", "#06B6D4", "#2563EB", "#7C3AED",
];
const HIGHLIGHT_COLORS = [
  "#FEF08A", "#BBF7D0", "#A5F3FC", "#FBCFE8", "#FED7AA",
  "#E9D5FF", "#FECACA", "#BFDBFE", "transparent",
];
const FONT_SIZE_MAP: Record<string, string> = { "1": "8", "2": "10", "3": "12", "4": "14", "5": "18", "6": "24", "7": "36" };
const SIZE_ENTRIES = [
  { val: "1", label: "8" },
  { val: "2", label: "10" },
  { val: "3", label: "12" },
  { val: "4", label: "14" },
  { val: "5", label: "18" },
  { val: "6", label: "24" },
  { val: "7", label: "36" },
];

function ColorGrid({
  colors, activeColor, onPick, label, hasClear,
}: {
  colors: string[]; activeColor?: string; onPick: (c: string) => void; label: string; hasClear?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.97 }}
      transition={{ type: "spring", damping: 25, stiffness: 400 }}
      style={{
        position: "absolute", top: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
        background: "var(--bg)", borderRadius: 10,
        border: "1px solid var(--border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        padding: 8, zIndex: 100, width: 172,
      }}
    >
      <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 6, fontWeight: 500 }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 4 }}>
        {colors.map((c) => (
          <button
            key={c}
            onMouseDown={(e) => { e.preventDefault(); onPick(c); }}
            title={c === "transparent" ? "None" : c}
            style={{
              width: 28, height: 28, borderRadius: 6, border: activeColor === c ? "2px solid var(--accent)" : "1px solid var(--border)",
              background: c === "transparent" ? "repeating-conic-gradient(#e5e7eb 0% 25%, transparent 0% 50%) 50%/12px 12px" : c,
              cursor: "pointer", padding: 0,
            }}
          />
        ))}
      </div>
      {hasClear && (
        <button
          onMouseDown={(e) => { e.preventDefault(); onPick(""); }}
          style={{
            marginTop: 6, width: "100%", padding: "5px 0", borderRadius: 6,
            border: "1px solid var(--border)", background: "transparent",
            fontSize: 11, color: "var(--text3)", cursor: "pointer",
          }}
        >
          Clear
        </button>
      )}
    </motion.div>
  );
}

function DocFormatBar({ lastActiveIframe }: { lastActiveIframe: React.RefObject<HTMLIFrameElement | null> }) {
  const [sel, setSel] = useState<DocSelState>({
    bold: false, italic: false, underline: false, strike: false,
    ul: false, ol: false, align: "left", block: "p",
    fontSize: "3", foreColor: "", fontName: "", inLink: false,
  });
  const [styleOpen, setStyleOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const [fontColorOpen, setFontColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const linkRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const fontRef = useRef<HTMLDivElement>(null);
  const fontColorRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Listen for selection state from the active doc iframe
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "docSelState") setSel(e.data as DocSelState);
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const anyOpen = styleOpen || sizeOpen || fontOpen || fontColorOpen || highlightOpen || linkOpen;
    if (!anyOpen) return;
    function onDown(e: MouseEvent) {
      const t = e.target as Node;
      if (styleOpen && styleRef.current && !styleRef.current.contains(t)) setStyleOpen(false);
      if (sizeOpen && sizeRef.current && !sizeRef.current.contains(t)) setSizeOpen(false);
      if (fontOpen && fontRef.current && !fontRef.current.contains(t)) setFontOpen(false);
      if (fontColorOpen && fontColorRef.current && !fontColorRef.current.contains(t)) setFontColorOpen(false);
      if (highlightOpen && highlightRef.current && !highlightRef.current.contains(t)) setHighlightOpen(false);
      if (linkOpen && linkRef.current && !linkRef.current.contains(t)) setLinkOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [styleOpen, sizeOpen, fontOpen, fontColorOpen, highlightOpen, linkOpen]);

  function closeAll() {
    setStyleOpen(false); setSizeOpen(false); setFontOpen(false);
    setFontColorOpen(false); setHighlightOpen(false);
  }

  function sendCmd(cmd: string, val?: string) {
    lastActiveIframe.current?.contentWindow?.postMessage({ type: "docExec", cmd, val }, "*");
  }

  function handleInsertChecklist() {
    lastActiveIframe.current?.contentWindow?.postMessage({ type: "insertChecklist", count: 3 }, "*");
  }

  function setBlock(tag: string) {
    sendCmd("formatBlock", tag);
    setStyleOpen(false);
  }

  function handleLinkClick() {
    if (sel.inLink) {
      lastActiveIframe.current?.contentWindow?.postMessage({ type: "applyLink", url: "" }, "*");
      return;
    }
    lastActiveIframe.current?.contentWindow?.postMessage({ type: "saveSelection" }, "*");
    setLinkText("");
    setLinkUrl("");
    closeAll();
    setLinkOpen(true);
  }

  function handleLinkConfirm() {
    const url = linkUrl.trim();
    if (!url) { setLinkOpen(false); return; }
    const fullUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
    const text = linkText.trim();
    lastActiveIframe.current?.contentWindow?.postMessage({ type: "applyLink", url: fullUrl, text: text || undefined }, "*");
    setLinkOpen(false);
  }

  const BLOCK_LABELS: Record<string, string> = {
    p: "Normal Text", h1: "Heading 1", h2: "Heading 2", h3: "Heading 3",
  };

  const fmtBtn = (active: boolean, onClick: () => void, icon: React.ReactNode, title: string, key?: string) => (
    <button
      key={key}
      data-doc-tip={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      style={{
        ...tbBtnBase,
        width: 36, height: 36, borderRadius: 8,
        background: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--accent)" : "var(--text2)",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg2)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = active ? "var(--accent-soft)" : "transparent"; }}
    >
      {icon}
    </button>
  );

  const ALIGNS = [
    { val: "left", icon: <HugeiconsIcon icon={TextAlignLeftIcon} size={18} />, cmd: "justifyLeft", title: "Align left" },
    { val: "center", icon: <HugeiconsIcon icon={TextAlignCenterIcon} size={18} />, cmd: "justifyCenter", title: "Align center" },
    { val: "right", icon: <HugeiconsIcon icon={TextAlignRightIcon} size={18} />, cmd: "justifyRight", title: "Align right" },
    { val: "justify", icon: <HugeiconsIcon icon={TextAlignJustifyLeftIcon} size={18} />, cmd: "justifyFull", title: "Justify" },
  ];

  return (
    <>
      <div style={{
        position: "sticky", top: 16, zIndex: 20,
        margin: "0 24px 16px",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.05)",
        padding: "8px 14px",
        display: "flex", alignItems: "center", gap: 3,
        flexWrap: expanded ? "wrap" : "nowrap",
        overflow: "visible",
        clipPath: expanded ? "none" : "inset(0 0 -400px 0)",
        maxHeight: expanded ? "none" : 52,
        transition: "max-height 200ms ease",
      }}>

        {/* Undo / Redo */}
        {fmtBtn(false, () => sendCmd("undo"), <HugeiconsIcon icon={UndoIcon} size={18} />, "Undo (⌘Z)")}
        {fmtBtn(false, () => sendCmd("redo"), <HugeiconsIcon icon={RedoIcon} size={18} />, "Redo (⌘⇧Z)")}

        <TbDivider />

        {/* Text style dropdown — opens on hover */}
        <div
          ref={styleRef}
          style={{ position: "relative" }}
          onMouseEnter={() => { closeAll(); setStyleOpen(true); }}
          onMouseLeave={() => setStyleOpen(false)}
        >
          <button
            style={{
              height: 36, padding: "0 12px", borderRadius: 8, border: "1px solid var(--border)",
              background: styleOpen ? "var(--accent-soft)" : "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 13, fontWeight: 500, color: styleOpen ? "var(--accent)" : "var(--text2)",
              whiteSpace: "nowrap",
            }}
          >
            {BLOCK_LABELS[sel.block] ?? "Normal Text"}
            <span style={{ fontSize: 9, color: "var(--text3)" }}>▾</span>
          </button>
          <AnimatePresence>
            {styleOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ type: "spring", damping: 28, stiffness: 500 }}
                style={{ position: "absolute", top: "100%", left: 0, paddingTop: 4 }}
              >
                <div style={{
                  background: "var(--bg)", borderRadius: 10,
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  padding: 4, minWidth: 160,
                }}>
                  {(["p", "h1", "h2", "h3"] as const).map((tag) => (
                    <button
                      key={tag}
                      onMouseDown={(e) => { e.preventDefault(); setBlock(tag); }}
                      style={{
                        width: "100%", padding: "7px 10px", borderRadius: 7,
                        border: "none", background: sel.block === tag ? "var(--accent-soft)" : "transparent",
                        color: sel.block === tag ? "var(--accent)" : "var(--text)",
                        fontSize: tag === "h1" ? 16 : tag === "h2" ? 14 : tag === "h3" ? 13 : 12.5,
                        fontWeight: tag !== "p" ? 600 : 400,
                        cursor: "pointer", textAlign: "left",
                      }}
                      onMouseEnter={(e) => { if (sel.block !== tag) e.currentTarget.style.background = "var(--bg2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = sel.block === tag ? "var(--accent-soft)" : "transparent"; }}
                    >
                      {BLOCK_LABELS[tag]}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Font size dropdown — opens on hover */}
        <div
          ref={sizeRef}
          style={{ position: "relative" }}
          onMouseEnter={() => { closeAll(); setSizeOpen(true); }}
          onMouseLeave={() => setSizeOpen(false)}
        >
          <button
            style={{
              height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid var(--border)",
              background: sizeOpen ? "var(--accent-soft)" : "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 13, fontWeight: 600, color: sizeOpen ? "var(--accent)" : "var(--text2)",
              minWidth: 36, justifyContent: "center",
            }}
          >
            {FONT_SIZE_MAP[sel.fontSize] ?? "12"}
            <span style={{ fontSize: 9, color: "var(--text3)" }}>▾</span>
          </button>
          <AnimatePresence>
            {sizeOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ type: "spring", damping: 28, stiffness: 500 }}
                style={{
                  position: "absolute", top: "100%", left: 0, paddingTop: 4,
                }}
              >
                <div style={{
                  background: "var(--bg)", borderRadius: 10,
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  padding: 4, minWidth: 130,
                }}>
                  {SIZE_ENTRIES.map(({ val, label }) => (
                    <button
                      key={val}
                      onMouseDown={(e) => { e.preventDefault(); sendCmd("fontSize", val); setSizeOpen(false); }}
                      style={{
                        width: "100%", padding: "7px 10px", borderRadius: 7,
                        border: "none", background: sel.fontSize === val ? "var(--accent-soft)" : "transparent",
                        color: sel.fontSize === val ? "var(--accent)" : "var(--text)",
                        fontSize: 12.5, fontWeight: 500,
                        cursor: "pointer", textAlign: "left",
                      }}
                      onMouseEnter={(e) => { if (sel.fontSize !== val) e.currentTarget.style.background = "var(--bg2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = sel.fontSize === val ? "var(--accent-soft)" : "transparent"; }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Font family dropdown — opens on hover */}
        <div
          ref={fontRef}
          style={{ position: "relative" }}
          onMouseEnter={() => { closeAll(); setFontOpen(true); }}
          onMouseLeave={() => setFontOpen(false)}
        >
          <button
            style={{
              height: 36, padding: "0 10px", borderRadius: 8, border: "1px solid var(--border)",
              background: fontOpen ? "var(--accent-soft)" : "transparent", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              fontSize: 13, fontWeight: 500, color: fontOpen ? "var(--accent)" : "var(--text2)",
              whiteSpace: "nowrap", maxWidth: 110,
            }}
          >
            <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
              {FONT_FAMILIES.find(f => sel.fontName.includes(f.val))?.label ?? "Inter"}
            </span>
            <span style={{ fontSize: 9, color: "var(--text3)", flexShrink: 0 }}>▾</span>
          </button>
          <AnimatePresence>
            {fontOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ type: "spring", damping: 28, stiffness: 500 }}
                style={{
                  position: "absolute", top: "100%", left: 0, paddingTop: 4,
                }}
              >
                <div style={{
                  background: "var(--bg)", borderRadius: 10,
                  border: "1px solid var(--border)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  padding: 4, minWidth: 160, maxHeight: 280, overflowY: "auto",
                }}>
                  {FONT_FAMILIES.map(({ val, label }) => (
                    <button
                      key={val}
                      onMouseDown={(e) => { e.preventDefault(); sendCmd("fontName", val); setFontOpen(false); }}
                      style={{
                        width: "100%", padding: "7px 10px", borderRadius: 7,
                        border: "none",
                        background: sel.fontName.includes(val) ? "var(--accent-soft)" : "transparent",
                        color: sel.fontName.includes(val) ? "var(--accent)" : "var(--text)",
                        fontSize: 13, fontWeight: 500, fontFamily: val,
                        cursor: "pointer", textAlign: "left",
                      }}
                      onMouseEnter={(e) => { if (!sel.fontName.includes(val)) e.currentTarget.style.background = "var(--bg2)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = sel.fontName.includes(val) ? "var(--accent-soft)" : "transparent"; }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <TbDivider />

        {/* Bold / Italic / Underline / Strikethrough */}
        {fmtBtn(sel.bold, () => sendCmd("bold"), <HugeiconsIcon icon={TextBoldIcon} size={18} />, "Bold (⌘B)")}
        {fmtBtn(sel.italic, () => sendCmd("italic"), <HugeiconsIcon icon={TextItalicIcon} size={18} />, "Italic (⌘I)")}
        {fmtBtn(sel.underline, () => sendCmd("underline"), <HugeiconsIcon icon={TextUnderlineIcon} size={18} />, "Underline (⌘U)")}
        {fmtBtn(sel.strike, () => sendCmd("strikeThrough"), <HugeiconsIcon icon={TextStrikethroughIcon} size={18} />, "Strikethrough")}

        <TbDivider />

        {/* Font color */}
        <div ref={fontColorRef} style={{ position: "relative" }}>
          <button
            data-doc-tip="Font color"
            onMouseDown={(e) => { e.preventDefault(); closeAll(); setFontColorOpen(o => !o); }}
            style={{
              ...tbBtnBase,
              width: 36, height: 36, borderRadius: 8,
              background: fontColorOpen ? "var(--accent-soft)" : "transparent",
              color: fontColorOpen ? "var(--accent)" : "var(--text2)",
              position: "relative",
            }}
            onMouseEnter={(e) => { if (!fontColorOpen) e.currentTarget.style.background = "var(--bg2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = fontColorOpen ? "var(--accent-soft)" : "transparent"; }}
          >
            <HugeiconsIcon icon={ColorPickerIcon} size={18} />
            {sel.foreColor && sel.foreColor !== "rgb(0, 0, 0)" && (
              <div style={{ position: "absolute", bottom: 4, left: 9, right: 9, height: 3, borderRadius: 1, background: sel.foreColor }} />
            )}
          </button>
          <AnimatePresence>
            {fontColorOpen && (
              <ColorGrid
                colors={FONT_COLORS}
                activeColor={sel.foreColor}
                label="Text color"
                hasClear
                onPick={(c) => {
                  if (c) sendCmd("foreColor", c);
                  else sendCmd("removeFormat");
                  setFontColorOpen(false);
                }}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Highlight color */}
        <div ref={highlightRef} style={{ position: "relative" }}>
          <button
            data-doc-tip="Highlight"
            onMouseDown={(e) => { e.preventDefault(); closeAll(); setHighlightOpen(o => !o); }}
            style={{
              ...tbBtnBase,
              width: 36, height: 36, borderRadius: 8,
              background: highlightOpen ? "var(--accent-soft)" : "transparent",
              color: highlightOpen ? "var(--accent)" : "var(--text2)",
            }}
            onMouseEnter={(e) => { if (!highlightOpen) e.currentTarget.style.background = "var(--bg2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = highlightOpen ? "var(--accent-soft)" : "transparent"; }}
          >
            <HugeiconsIcon icon={PaintBucketIcon} size={18} />
          </button>
          <AnimatePresence>
            {highlightOpen && (
              <ColorGrid
                colors={HIGHLIGHT_COLORS}
                label="Highlight"
                hasClear
                onPick={(c) => {
                  if (c && c !== "transparent") sendCmd("hiliteColor", c);
                  else sendCmd("hiliteColor", "transparent");
                  setHighlightOpen(false);
                }}
              />
            )}
          </AnimatePresence>
        </div>

        <TbDivider />

        {/* Alignment */}
        {ALIGNS.map((a) => fmtBtn(sel.align === a.val, () => sendCmd(a.cmd), a.icon, a.title, a.val))}

        <TbDivider />

        {/* Indent / Outdent */}
        {fmtBtn(false, () => sendCmd("outdent"), <HugeiconsIcon icon={TextIndentLessIcon} size={18} />, "Decrease indent")}
        {fmtBtn(false, () => sendCmd("indent"), <HugeiconsIcon icon={TextIndentMoreIcon} size={18} />, "Increase indent")}

        <TbDivider />

        {/* Lists */}
        {fmtBtn(sel.ul, () => sendCmd("insertUnorderedList"), <HugeiconsIcon icon={LeftToRightListBulletIcon} size={18} />, "Bullet list")}
        {fmtBtn(sel.ol, () => sendCmd("insertOrderedList"), <HugeiconsIcon icon={LeftToRightListNumberIcon} size={18} />, "Numbered list")}

        <TbDivider />

        {/* Link — inline popover */}
        <div ref={linkRef} style={{ position: "relative" }}>
          {fmtBtn(sel.inLink || linkOpen, handleLinkClick, <HugeiconsIcon icon={Link01Icon} size={18} />, sel.inLink ? "Remove link" : "Insert link")}
          <AnimatePresence>
            {linkOpen && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                transition={{ type: "spring", damping: 28, stiffness: 500 }}
                style={{
                  position: "absolute", top: "calc(100% + 6px)", right: 0,
                  background: "var(--bg)", borderRadius: 12, padding: 14,
                  boxShadow: "0 8px 32px rgba(0,0,0,0.16), 0 2px 6px rgba(0,0,0,0.08)",
                  border: "1px solid var(--border)",
                  width: 260, zIndex: 100,
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text)", marginBottom: 10 }}>Insert Link</div>
                <input
                  autoFocus
                  placeholder="Enter link text..."
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 8,
                    border: "1px solid var(--border)", fontSize: 12.5,
                    outline: "none", background: "var(--bg)", color: "var(--text)",
                    boxSizing: "border-box", marginBottom: 8,
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                />
                <input
                  placeholder="Enter link URL..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLinkConfirm();
                    if (e.key === "Escape") setLinkOpen(false);
                  }}
                  style={{
                    width: "100%", padding: "8px 10px", borderRadius: 8,
                    border: "1px solid var(--border)", fontSize: 12.5,
                    outline: "none", background: "var(--bg)", color: "var(--text)",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                />
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 10 }}>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); setLinkOpen(false); }}
                    style={{
                      padding: "6px 14px", borderRadius: 8, border: "none",
                      background: "transparent", color: "var(--text2)", cursor: "pointer", fontSize: 12.5,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onMouseDown={(e) => { e.preventDefault(); handleLinkConfirm(); }}
                    style={{
                      padding: "6px 14px", borderRadius: 8, border: "none",
                      background: "var(--accent)", color: "white", cursor: "pointer",
                      fontSize: 12.5, fontWeight: 500,
                    }}
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Checklist */}
        {fmtBtn(false, handleInsertChecklist, <HugeiconsIcon icon={CheckListIcon} size={18} />, "Checklist")}

        <TbDivider />

        {/* Clear formatting */}
        {fmtBtn(false, () => sendCmd("removeFormat"), <HugeiconsIcon icon={CleanIcon} size={18} />, "Clear formatting")}

        {/* Expand / Collapse toggle — always visible at the end */}
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <button
            data-doc-tip={expanded ? "Collapse" : "More tools"}
            data-doc-tip-right
            onMouseDown={(e) => { e.preventDefault(); setExpanded(o => !o); }}
            style={{
              ...tbBtnBase,
              width: 36, height: 36, borderRadius: 8,
              background: expanded ? "var(--accent-soft)" : "transparent",
              color: expanded ? "var(--accent)" : "var(--text3)",
              transition: "background 150ms, color 150ms",
            }}
            onMouseEnter={(e) => { if (!expanded) e.currentTarget.style.background = "var(--bg2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = expanded ? "var(--accent-soft)" : "transparent"; }}
          >
            <span style={{ display: "flex", transition: "transform 200ms", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
              <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
            </span>
          </button>
        </div>
      </div>
    </>
  );
}

// ─── EditOverlay ───────────────────────────────────────────────────────────────

const RESIZE_HANDLES: Array<{ dir: string; style: React.CSSProperties }> = [
  { dir: "nw", style: { top: -5, left: -5, cursor: "nw-resize" } },
  { dir: "n",  style: { top: -5, left: "50%", transform: "translateX(-50%)", cursor: "n-resize" } },
  { dir: "ne", style: { top: -5, right: -5, cursor: "ne-resize" } },
  { dir: "w",  style: { top: "50%", left: -5, transform: "translateY(-50%)", cursor: "w-resize" } },
  { dir: "e",  style: { top: "50%", right: -5, transform: "translateY(-50%)", cursor: "e-resize" } },
  { dir: "sw", style: { bottom: -5, left: -5, cursor: "sw-resize" } },
  { dir: "s",  style: { bottom: -5, left: "50%", transform: "translateX(-50%)", cursor: "s-resize" } },
  { dir: "se", style: { bottom: -5, right: -5, cursor: "se-resize" } },
];

function EditOverlay({
  iframeRef,
  scale,
  slideWidth,
  onBecomeActive,
  onAddToChat,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  scale: number;
  slideWidth: number;
  onBecomeActive: () => void;
  onAddToChat?: (text: string) => void;
}) {
  const [sel, setSel] = useState<SelState | null>(null);
  const [capture, setCapture] = useState<CaptureState>(null);
  const [openDrop, setOpenDrop] = useState<string | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside toolbar
  useEffect(() => {
    if (!openDrop) return;
    function onClick(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) setOpenDrop(null);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openDrop]);

  const selRef = useRef<SelState | null>(null);
  const captureRef = useRef<CaptureState>(null);
  const onBecomeActiveRef = useRef(onBecomeActive);
  onBecomeActiveRef.current = onBecomeActive;

  useEffect(() => { selRef.current = sel; }, [sel]);
  useEffect(() => { captureRef.current = capture; }, [capture]);

  function send(msg: Record<string, unknown>) {
    iframeRef.current?.contentWindow?.postMessage(msg, "*");
  }

  useEffect(() => {
    function onMsg(e: MessageEvent) {
      if (iframeRef.current && e.source !== iframeRef.current.contentWindow) return;
      const d = e.data;
      if (!d?.type) return;
      if (d.type === "select") {
        onBecomeActiveRef.current();
        setSel({ id: d.id, etype: d.etype || "text", rect: d.rect, styles: d.styles || {}, text: d.text });
      } else if (d.type === "deselect") {
        setSel(null);
      } else if (d.type === "rectback") {
        setSel(p => (p && p.id === d.id) ? { ...p, rect: d.rect as SelState["rect"] } : p);
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [iframeRef]);

  function handleCaptureMouseMove(e: React.MouseEvent) {
    const c = captureRef.current;
    const s = selRef.current;
    if (!c || !s) return;

    if (c.kind === "drag") {
      const nx = Math.round(c.bx + (e.clientX - c.mx) / scale);
      const ny = Math.round(c.by + (e.clientY - c.my) / scale);
      setSel(p => p ? { ...p, rect: { ...p.rect, x: nx, y: ny } } : p);
      send({ type: "move", id: s.id, x: nx, y: ny });
    } else if (c.kind === "resize") {
      const dx = (e.clientX - c.mx) / scale;
      const dy = (e.clientY - c.my) / scale;
      let nx = c.bx, ny = c.by, nw = c.bw, nh = c.bh;
      const dir = c.dir;
      if (dir === "e" || dir === "ne" || dir === "se") nw = Math.max(20, Math.round(c.bw + dx));
      if (dir === "w" || dir === "nw" || dir === "sw") { nw = Math.max(20, Math.round(c.bw - dx)); nx = c.bx + (c.bw - nw); }
      if (dir === "s" || dir === "se" || dir === "sw") nh = Math.max(20, Math.round(c.bh + dy));
      if (dir === "n" || dir === "ne" || dir === "nw") { nh = Math.max(20, Math.round(c.bh - dy)); ny = c.by + (c.bh - nh); }
      setSel(p => p ? { ...p, rect: { x: nx, y: ny, w: nw, h: nh } } : p);
      send({ type: "resize", id: s.id, x: nx, y: ny, w: nw, h: nh });
    }
  }

  function handleCaptureMouseUp() {
    setCapture(null);
    const s = selRef.current;
    if (s) setTimeout(() => send({ type: "rect", id: s.id }), 60);
  }

  const selBox = sel ? {
    left: sel.rect.x * scale,
    top: sel.rect.y * scale,
    width: sel.rect.w * scale,
    height: sel.rect.h * scale,
  } : null;

  const toolbarBelow = sel ? sel.rect.y * scale < 56 : false;
  const toolbarAlignRight = sel ? (sel.rect.x + sel.rect.w) * scale > slideWidth * 0.6 : false;
  const isBold = sel?.styles.fontWeight === "bold" || sel?.styles.fontWeight === "700";
  const isItalic = sel?.styles.fontStyle === "italic";
  const currentAlign = sel?.styles.textAlign || "left";
  const currentFontSize = sel ? parseInt(sel.styles.fontSize) || 16 : 16;

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 10, pointerEvents: "none" }}>

      {/* Selection box */}
      {sel && selBox && (
        <div
          style={{
            position: "absolute",
            left: selBox.left, top: selBox.top,
            width: selBox.width, height: selBox.height,
            border: "2px solid #4338CA",
            borderRadius: 2,
            pointerEvents: "auto",
            cursor: "move",
            zIndex: 20,
            boxSizing: "border-box",
          }}
          onMouseDown={(e) => {
            if ((e.target as HTMLElement).dataset.dir) return;
            if ((e.target as HTMLElement).closest("[data-toolbar]")) return;
            e.preventDefault();
            setCapture({ kind: "drag", mx: e.clientX, my: e.clientY, bx: sel.rect.x, by: sel.rect.y });
          }}
        >
          {/* 8 resize handles */}
          {RESIZE_HANDLES.map(({ dir, style }) => (
            <div
              key={dir}
              data-dir={dir}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCapture({ kind: "resize", dir, mx: e.clientX, my: e.clientY, bx: sel.rect.x, by: sel.rect.y, bw: sel.rect.w, bh: sel.rect.h });
              }}
              style={{
                position: "absolute",
                width: 10, height: 10,
                background: "white",
                border: "2px solid #4338CA",
                borderRadius: 2,
                zIndex: 1,
                ...style,
              }}
            />
          ))}

          {/* Floating toolbar */}
          <AnimatePresence>
            <motion.div
              ref={toolbarRef}
              data-toolbar="1"
              initial={{ opacity: 0, y: toolbarBelow ? 6 : -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: toolbarBelow ? 6 : -6, scale: 0.95 }}
              transition={{ type: "spring", damping: 24, stiffness: 400 }}
              style={{
                position: "absolute",
                ...(toolbarBelow
                  ? { top: "100%", marginTop: 10 }
                  : { bottom: "100%", marginBottom: 10 }),
                ...(toolbarAlignRight ? { right: 0 } : { left: 0 }),
                display: "flex", alignItems: "center", gap: 1,
                background: "var(--bg)",
                borderRadius: 10,
                padding: "3px 4px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)",
                border: "1px solid var(--border)",
                whiteSpace: "nowrap",
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Add to chat */}
              {sel.etype === "text" && onAddToChat && (
                <>
                  <button
                    onClick={() => { if (sel.text) onAddToChat(sel.text); }}
                    title="Add to chat"
                    style={{ ...tbBtnBase, width: "auto", padding: "0 10px", gap: 5, fontSize: 12.5, fontWeight: 500, color: "var(--text2)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: 14 }}>↵</span>
                    Add to chat
                  </button>
                  <TbDivider />
                </>
              )}

              {sel.etype === "text" && (() => {
                const TEXT_TYPES = [
                  { label: "Body Text", icon: "T", size: "18px", weight: "400" },
                  { label: "Heading 1", icon: "H1", size: "48px", weight: "700" },
                  { label: "Heading 2", icon: "H2", size: "36px", weight: "600" },
                  { label: "Heading 3", icon: "H3", size: "28px", weight: "600" },
                  { label: "Heading 4", icon: "H4", size: "24px", weight: "500" },
                  { label: "Heading 5", icon: "H5", size: "20px", weight: "500" },
                ];
                const FONTS = [
                  { label: "System UI", val: "system-ui, -apple-system, sans-serif" },
                  { label: "Inter", val: "Inter, sans-serif" },
                  { label: "Georgia", val: "Georgia, serif" },
                  { label: "Courier New", val: "'Courier New', monospace" },
                  { label: "Arial", val: "Arial, Helvetica, sans-serif" },
                  { label: "Times", val: "'Times New Roman', serif" },
                  { label: "Verdana", val: "Verdana, sans-serif" },
                  { label: "Trebuchet", val: "'Trebuchet MS', sans-serif" },
                ];
                const SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48, 56, 64, 72];
                const TEXT_COLORS = ["#000000","#333333","#666666","#999999","#CCCCCC","#FFFFFF","#E53E3E","#DD6B20","#D69E2E","#38A169","#3182CE","#805AD5"];
                const BG_COLORS = ["#FEE2E2","#FED7AA","#FEF3C7","#C6F6D5","#BEE3F8","#E9D8FD","#FFFFFF","#F7FAFC","#EDF2F7","#E2E8F0","transparent","rgba(0,0,0,0)"];
                const ALIGNS = [
                  { val: "left", icon: TextAlignLeftIcon },
                  { val: "center", icon: TextAlignCenterIcon },
                  { val: "right", icon: TextAlignRightIcon },
                  { val: "justify", icon: TextAlignJustifyLeftIcon },
                ];
                const curType = TEXT_TYPES.find(t => t.size === currentFontSize + "px" && t.weight === (isBold ? "700" : sel.styles.fontWeight)) || TEXT_TYPES[0];
                const curFontLabel = FONTS.find(f => sel.styles.fontFamily?.includes(f.label.split(" ")[0]))?.label || "System UI";
                const hasUnderline = sel.styles.textDecoration?.includes("underline");
                const hasStrike = sel.styles.textDecoration?.includes("line-through");
                const curLetterSpacing = parseFloat(sel.styles.letterSpacing) || 0;
                const curLineHeight = parseFloat(sel.styles.lineHeight) || 1.4;

                const selId = sel.id;
                function setStyle(prop: string, val: string) {
                  send({ type: "style", id: selId, prop, val });
                  setSel(p => p ? { ...p, styles: { ...p.styles, [prop]: val } } : p);
                }

                return (
                  <>
                    {/* Text Type dropdown */}
                    <div style={{ position: "relative" }}>
                      <button onClick={() => setOpenDrop(openDrop === "type" ? null : "type")}
                        style={{ ...tbBtnBase, width: "auto", padding: "0 8px", gap: 4, fontSize: 12.5, fontWeight: 500, color: "var(--text)" }}>
                        {curType.label} <span style={{ fontSize: 9, color: "var(--text3)" }}>▾</span>
                      </button>
                      <TbDropdown open={openDrop === "type"}>
                          {TEXT_TYPES.map(t => (
                            <button key={t.label} onClick={() => { setStyle("fontSize", t.size); setStyle("fontWeight", t.weight); setOpenDrop(null); }}
                              style={{ ...dropItemStyle, fontWeight: curType.label === t.label ? 600 : 400, background: curType.label === t.label ? "var(--accent-soft)" : "transparent" }}>
                              <span style={{ width: 24, fontSize: 12, fontWeight: 600, color: "var(--text3)" }}>{t.icon}</span>
                              {t.label}
                            </button>
                          ))}
                      </TbDropdown>
                    </div>

                    <TbDivider />

                    {/* Font Family dropdown */}
                    <div style={{ position: "relative" }}>
                      <button onClick={() => setOpenDrop(openDrop === "font" ? null : "font")}
                        style={{ ...tbBtnBase, width: "auto", padding: "0 8px", gap: 4, fontSize: 12.5, fontWeight: 500, color: "var(--text)", maxWidth: 120 }}>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{curFontLabel}</span>
                        <span style={{ fontSize: 9, color: "var(--text3)", flexShrink: 0 }}>▾</span>
                      </button>
                      <TbDropdown open={openDrop === "font"} style={{ width: 180, maxHeight: 240, overflowY: "auto" }}>
                          {FONTS.map(f => (
                            <button key={f.label} onClick={() => { setStyle("fontFamily", f.val); setOpenDrop(null); }}
                              style={{ ...dropItemStyle, fontFamily: f.val, fontWeight: curFontLabel === f.label ? 600 : 400, background: curFontLabel === f.label ? "var(--accent-soft)" : "transparent" }}>
                              {f.label}
                            </button>
                          ))}
                      </TbDropdown>
                    </div>

                    <TbDivider />

                    {/* Font Size dropdown */}
                    <div style={{ position: "relative" }}>
                      <button onClick={() => setOpenDrop(openDrop === "size" ? null : "size")}
                        style={{ ...tbBtnBase, width: "auto", padding: "0 8px", gap: 4, fontSize: 12.5, fontWeight: 500, color: "var(--text)", minWidth: 36 }}>
                        {currentFontSize} <span style={{ fontSize: 9, color: "var(--text3)" }}>▾</span>
                      </button>
                      <TbDropdown open={openDrop === "size"} style={{ width: 70, maxHeight: 240, overflowY: "auto" }}>
                          {SIZES.map(s => (
                            <button key={s} onClick={() => { setStyle("fontSize", s + "px"); setOpenDrop(null); }}
                              style={{ ...dropItemStyle, fontWeight: currentFontSize === s ? 600 : 400, background: currentFontSize === s ? "var(--accent-soft)" : "transparent" }}>
                              {s}
                            </button>
                          ))}
                      </TbDropdown>
                    </div>

                    <TbDivider />

                    {/* Text Color dropdown */}
                    <div style={{ position: "relative" }}>
                      <button onClick={() => setOpenDrop(openDrop === "color" ? null : "color")}
                        style={{ ...tbBtnBase, width: "auto", padding: "0 6px", gap: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: sel.styles.color || "var(--text)", fontFamily: "serif" }}>A</span>
                        <span style={{ fontSize: 9, color: "var(--text3)" }}>▾</span>
                      </button>
                      <TbDropdown open={openDrop === "color"} alignRight style={{ width: 220, padding: 12 }}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", margin: "0 0 8px" }}>Text Color</p>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6, marginBottom: 14 }}>
                            {TEXT_COLORS.map(c => (
                              <button key={c} onClick={() => { setStyle("color", c); }}
                                style={{ width: 28, height: 28, borderRadius: 6, border: sel.styles.color === c ? "2px solid var(--accent)" : "1px solid var(--border)", background: c, cursor: "pointer" }} />
                            ))}
                          </div>
                          <p style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", margin: "0 0 8px" }}>Background Color</p>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
                            {BG_COLORS.map(c => (
                              <button key={c} onClick={() => { setStyle("backgroundColor", c); }}
                                style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", background: c === "transparent" ? "repeating-conic-gradient(#ddd 0% 25%, #fff 0% 50%) 50%/12px 12px" : c, cursor: "pointer" }} />
                            ))}
                          </div>
                      </TbDropdown>
                    </div>

                    <TbDivider />

                    {/* Bold/Italic/Underline/Strikethrough dropdown */}
                    <div style={{ position: "relative" }}>
                      <button onClick={() => setOpenDrop(openDrop === "style" ? null : "style")}
                        style={{ ...tbBtnBase, width: "auto", padding: "0 6px", gap: 3, color: isBold ? "var(--accent)" : "var(--text2)" }}>
                        <HugeiconsIcon icon={TextBoldIcon} size={15} />
                        <span style={{ fontSize: 9, color: "var(--text3)" }}>▾</span>
                      </button>
                      <TbDropdown open={openDrop === "style"} style={{ padding: 4, display: "flex", gap: 2 }}>
                          {([
                            { icon: TextBoldIcon, active: isBold, prop: "fontWeight", on: "bold", off: "normal" },
                            { icon: TextItalicIcon, active: isItalic, prop: "fontStyle", on: "italic", off: "normal" },
                            { icon: TextUnderlineIcon, active: hasUnderline, prop: "textDecoration", on: "underline", off: "none" },
                            { icon: TextStrikethroughIcon, active: hasStrike, prop: "textDecoration", on: "line-through", off: "none" },
                          ] as const).map(({ icon, active, prop, on, off }) => (
                            <button key={prop + on} onClick={() => setStyle(prop, active ? off : on)}
                              style={{ ...tbBtnBase, background: active ? "var(--accent-soft)" : "transparent", color: active ? "var(--accent)" : "var(--text2)" }}
                              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg2)"; }}
                              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                              <HugeiconsIcon icon={icon} size={15} />
                            </button>
                          ))}
                      </TbDropdown>
                    </div>

                    <TbDivider />

                    {/* Alignment dropdown */}
                    <div style={{ position: "relative" }}>
                      <button onClick={() => setOpenDrop(openDrop === "align" ? null : "align")}
                        style={{ ...tbBtnBase, width: "auto", padding: "0 6px", gap: 3, color: "var(--text2)" }}>
                        <HugeiconsIcon icon={ALIGNS.find(a => a.val === currentAlign || (a.val === "left" && currentAlign === "start"))?.icon || TextAlignLeftIcon} size={15} />
                        <span style={{ fontSize: 9, color: "var(--text3)" }}>▾</span>
                      </button>
                      <TbDropdown open={openDrop === "align"} alignRight style={{ padding: 4, display: "flex", gap: 2 }}>
                          {ALIGNS.map(a => {
                            const isActive = currentAlign === a.val || (a.val === "left" && currentAlign === "start");
                            return (
                              <button key={a.val} onClick={() => { setStyle("textAlign", a.val); setOpenDrop(null); }}
                                style={{ ...tbBtnBase, background: isActive ? "var(--accent-soft)" : "transparent", color: isActive ? "var(--accent)" : "var(--text2)" }}
                                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg2)"; }}
                                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                                <HugeiconsIcon icon={a.icon} size={15} />
                              </button>
                            );
                          })}
                      </TbDropdown>
                    </div>

                    <TbDivider />

                    {/* Letter Spacing / Line Height dropdown */}
                    <div style={{ position: "relative" }}>
                      <button onClick={() => setOpenDrop(openDrop === "spacing" ? null : "spacing")}
                        title="Letter Spacing"
                        style={{ ...tbBtnBase, color: "var(--text2)" }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg2)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                        <HugeiconsIcon icon={LetterSpacingIcon} size={15} />
                      </button>
                      <TbDropdown open={openDrop === "spacing"} alignRight style={{ width: 220, padding: "14px 16px" }}>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 8 }}>Letter Spacing</label>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                            <input type="range" min={-2} max={10} step={0.5} value={curLetterSpacing}
                              onChange={(e) => setStyle("letterSpacing", e.target.value + "px")}
                              style={{ flex: 1, accentColor: "var(--accent)" }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", minWidth: 28, textAlign: "right" }}>{curLetterSpacing}</span>
                          </div>
                          <label style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 8 }}>Line Height</label>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <input type="range" min={0.8} max={2.5} step={0.1} value={curLineHeight}
                              onChange={(e) => setStyle("lineHeight", e.target.value)}
                              style={{ flex: 1, accentColor: "var(--accent)" }} />
                            <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text)", minWidth: 28, textAlign: "right" }}>{curLineHeight.toFixed(1)}</span>
                          </div>
                      </TbDropdown>
                    </div>

                    <TbDivider />
                  </>
                );
              })()}

              {/* Delete */}
              <button
                onClick={() => { send({ type: "delete", id: sel.id }); setSel(null); }}
                title="Delete element"
                style={{ ...tbBtnBase, color: "var(--text3)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--red-soft)"; e.currentTarget.style.color = "var(--red)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text3)"; }}
              >
                <HugeiconsIcon icon={Delete02Icon} size={15} />
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Capture layer — covers iframe during drag/resize so mouse events fire reliably */}
      {capture && (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 50,
            cursor: capture.kind === "drag" ? "move" : "grabbing",
            pointerEvents: "auto",
          }}
          onMouseMove={handleCaptureMouseMove}
          onMouseUp={handleCaptureMouseUp}
        />
      )}
    </div>
  );
}

// ─── SlideFrame ────────────────────────────────────────────────────────────────

function SlideFrame({
  slide, theme, scale, slideWidth, slideHeight, nativeW = 1280, nativeH = 720, isDoc = false,
  isActive, onClick, logoResult, isFirstSlide, themeColors,
  isEditing, onRegisterIframe, onBecomeActive, onAddToChat, isBuilding,
}: {
  slide: Slide;
  theme: ThemeName;
  scale: number;
  slideWidth: number;
  slideHeight: number;
  nativeW?: number;
  nativeH?: number;
  isDoc?: boolean;
  isActive: boolean;
  onClick: () => void;
  logoResult?: LogoResult | null;
  isFirstSlide?: boolean;
  themeColors?: ThemeColors;
  isEditing?: boolean;
  onRegisterIframe?: (slideId: string, el: HTMLIFrameElement | null) => void;
  onBecomeActive?: () => void;
  onAddToChat?: (text: string) => void;
  isBuilding?: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const finishedIframeRef = useRef<HTMLIFrameElement | null>(null);
  const finishedReadyRef = useRef(false);
  const prevContentRef = useRef(slide.content);

  // Full HTML documents (from skills) have no .slide-root — can't use postMessage approach
  const isFullDoc = slide.content.trimStart().startsWith("<!DOCTYPE") || slide.content.trimStart().startsWith("<html");

  const html = useMemo(
    () => buildSlideHtml(slide, theme, logoResult, isFirstSlide, themeColors, undefined, isBuilding, isDoc),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slide.id, slide.content, theme, logoResult, isFirstSlide, themeColors, isBuilding]
  );

  // Stable base HTML for postMessage-based finished slides (empty .slide-root shell + bridge script)
  // Note: Content is agent-generated slide HTML rendered inside a sandboxed iframe (allow-same-origin only,
  // scripts only enabled for the bridge). This matches the existing BuildingSlideFrame pattern.
  const baseHtml = useMemo(() => {
    if (isFullDoc || isEditing) return "";
    const emptySlide = { ...slide, content: "" };
    const shell = buildSlideHtml(emptySlide, theme, logoResult, isFirstSlide, themeColors, undefined, false, isDoc);
    const bridge = `<script>(function(){
window.addEventListener('message',function(e){
if(e.data&&e.data.type==='updateContent'){
var r=document.querySelector('.slide-root');
if(r)r.textContent='';
var t=document.createElement('template');
t.innerHTML=e.data.html;
r.appendChild(t.content);
}
});
window.parent.postMessage({type:'finishedReady'},'*');
})();<\/script>`;
    return shell.replace("</body>", bridge + "</body>");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slide.id, theme, logoResult, isFirstSlide, themeColors, isDoc]);

  // Listen for ready signal from finished-slide iframe
  useEffect(() => {
    if (isFullDoc || isEditing) return;
    finishedReadyRef.current = false;
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "finishedReady" && e.source === finishedIframeRef.current?.contentWindow) {
        finishedReadyRef.current = true;
        finishedIframeRef.current?.contentWindow?.postMessage(
          { type: "updateContent", html: slide.content }, "*"
        );
        prevContentRef.current = slide.content;
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [baseHtml, isFullDoc, isEditing, slide.content]);

  // Push content updates via postMessage when content changes (no iframe recreation)
  useEffect(() => {
    if (isFullDoc || isEditing || !finishedReadyRef.current) return;
    if (slide.content === prevContentRef.current) return;
    prevContentRef.current = slide.content;
    finishedIframeRef.current?.contentWindow?.postMessage(
      { type: "updateContent", html: slide.content }, "*"
    );
  }, [slide.content, isFullDoc, isEditing]);

  useEffect(() => {
    if (!isEditing) {
      onRegisterIframe?.(slide.id, null);
      setBlobUrl(null);
      return;
    }
    // Capture HTML snapshot at edit entry time
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const editHtml = buildSlideHtml(slide, theme, logoResult, isFirstSlide, themeColors, undefined, false, isDoc);
    // Doc pages get a simple contentEditable bridge; slides get the full element-tagging bridge
    const bridge = isDoc ? DOC_BRIDGE_SCRIPT : BRIDGE_SCRIPT;
    const injected = editHtml.includes("</body>")
      ? editHtml.replace("</body>", bridge + "</body>")
      : editHtml + bridge;
    const blob = new Blob([injected], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      onRegisterIframe?.(slide.id, null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  return (
    <div
      onClick={isEditing ? undefined : onClick}
      onMouseEnter={isEditing ? undefined : () => setIsHovered(true)}
      onMouseLeave={isEditing ? undefined : () => setIsHovered(false)}
      style={{
        width: slideWidth,
        height: slideHeight,
        cursor: isEditing ? "default" : "pointer",
        overflow: "hidden",
        background: "#fff",
        boxShadow: isEditing
          ? "inset 0 0 0 2px #4338CA, 0 4px 24px -4px rgba(67,56,202,0.2)"
          : isActive
          ? "inset 0 0 0 2px var(--accent), 0 4px 24px -4px rgba(0,0,0,0.16)"
          : isHovered
          ? "0 4px 20px -4px rgba(0,0,0,0.18), inset 0 0 0 1.5px rgba(0,0,0,0.10)"
          : "0 2px 10px -2px rgba(0,0,0,0.08), inset 0 0 0 1px rgba(0,0,0,0.05)",
        transition: "box-shadow 140ms ease",
        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
        position: "relative",
        isolation: "isolate",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: nativeW, height: nativeH,
          transform: `scale(${scale})`, transformOrigin: "0 0",
          position: "absolute", top: 0, left: 0,
        }}
      >
        {isEditing && blobUrl ? (
          <iframe
            ref={iframeRef}
            key={`${slide.id}-edit`}
            src={blobUrl}
            title={slide.title}
            sandbox="allow-scripts allow-same-origin"
            scrolling="no"
            onLoad={() => {
              if (iframeRef.current) onRegisterIframe?.(slide.id, iframeRef.current);
            }}
            style={{ display: "block", width: nativeW, height: nativeH, border: "none", pointerEvents: "auto" }}
          />
        ) : isFullDoc || isDoc ? (
          /* Full HTML doc slides or doc pages — use srcDoc directly.
             Doc pages have no .slide-root class so the postMessage bridge
             selector would fail and leave a blank iframe.
             Sheets (isFullDoc=true) need allow-scripts for tab switching and
             pointer-events for scrolling/clicking. */
          <iframe
            key={`${slide.id}-${slide.content.length}`}
            srcDoc={html}
            title={slide.title}
            sandbox={isFullDoc && !isDoc ? "allow-scripts allow-same-origin" : "allow-same-origin"}
            scrolling="auto"
            style={{ display: "block", width: nativeW, height: nativeH, border: "none", pointerEvents: isFullDoc && !isDoc ? "auto" : "none" }}
          />
        ) : (
          /* Fragment slides — stable iframe, content updates via postMessage (no flash) */
          <iframe
            ref={finishedIframeRef}
            key={`${slide.id}-${theme}`}
            srcDoc={baseHtml}
            title={slide.title}
            sandbox="allow-scripts allow-same-origin"
            scrolling="no"
            style={{ display: "block", width: nativeW, height: nativeH, border: "none", pointerEvents: "none" }}
          />
        )}
      </div>

      {isEditing && blobUrl && onBecomeActive && !isDoc && (
        <EditOverlay
          iframeRef={iframeRef}
          scale={scale}
          slideWidth={slideWidth}
          onBecomeActive={onBecomeActive}
          onAddToChat={onAddToChat}
        />
      )}
    </div>
  );
}

// ─── CopyButton ────────────────────────────────────────────────────────────────

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [content]);
  return (
    <button
      onClick={handleCopy}
      title="Copy HTML"
      style={{
        display: "flex", alignItems: "center", gap: 5,
        height: 26, padding: "0 10px", borderRadius: 6,
        border: "1px solid var(--border)",
        background: copied ? "var(--green-soft)" : "var(--bg2)",
        color: copied ? "var(--green)" : "var(--text3)",
        fontSize: 11.5, fontWeight: 500, cursor: "pointer",
        transition: "background 150ms, color 150ms, border-color 150ms",
        letterSpacing: "-0.01em", flexShrink: 0,
      }}
      onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.color = "var(--text2)"; } }}
      onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; } }}
    >
      <HugeiconsIcon icon={copied ? CopyCheckIcon : Copy01Icon} size={12} />
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ─── CodeView ─────────────────────────────────────────────────────────────────

export function CodeView({ slides, sessionType = "slides" }: { slides: Slide[]; sessionType?: "slides" | "docs" | "sheets" | "website" }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    function measure() {
      if (!el) return;
      const w = el.clientWidth;
      if (w > 0) setContainerWidth(w);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, []);

  const SLIDE_PADDING_X = 24;
  const SLIDE_GAP = 16;
  const SLIDE_PADDING_TOP = 16;

  const nativeW = sessionType === "sheets" ? 1280 : sessionType === "docs" ? 816 : 1280;
  const nativeH = sessionType === "sheets" ? 800 : sessionType === "docs" ? 1056 : 720;
  const slideWidth = Math.max(containerWidth - SLIDE_PADDING_X * 2, 0);
  const scale = slideWidth / nativeW;
  const slideHeight = Math.round(nativeH * scale);

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden"
      style={{ background: "var(--bg2)", scrollbarWidth: "none" }}
    >
      {slides.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p style={{ fontSize: 13, color: "var(--text3)" }}>{sessionType === "docs" ? "No pages yet." : "No slides yet."}</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: SLIDE_GAP, paddingLeft: SLIDE_PADDING_X, paddingRight: SLIDE_PADDING_X, paddingTop: SLIDE_PADDING_TOP, paddingBottom: 48 }}>
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              style={{
                width: slideWidth, height: slideHeight,
                background: "var(--bg)", borderRadius: "var(--r-lg)",
                border: "1px solid var(--border)", overflow: "hidden",
                flexShrink: 0, display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text3)", background: "var(--bg2)", borderRadius: 4, padding: "2px 7px", letterSpacing: "0.04em" }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--text2)", letterSpacing: "-0.01em", flex: 1 }}>
                  {slide.title || `Slide ${i + 1}`}
                </span>
                <CopyButton content={slide.content} />
              </div>
              <div style={{ flex: 1, overflow: "auto", scrollbarWidth: "none" }} className="[&::-webkit-scrollbar]:hidden">
                <pre
                  style={{
                    margin: 0, padding: "14px 16px",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 11.5, lineHeight: 1.7, color: "var(--text)",
                    whiteSpace: "pre-wrap", wordBreak: "break-all",
                  }}
                  dangerouslySetInnerHTML={{ __html: highlightHtml(slide.content) }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── BuildingSlideFrame ───────────────────────────────────────────────────────
// Renders the building slide as an IFRAME with postMessage-based content updates.
// The iframe loads a full HTML document once (proper 1280x720 background, all CSS),
// then we push partial content into .slide-root via postMessage — no document
// reload, no blink, and the slide fills the full frame (no white space gaps).

const BUILDING_BRIDGE = `<script>(function(){
window.addEventListener('message',function(e){
  if(e.data&&e.data.type==='updateContent'){
    var root=document.querySelector('.slide-root');
    if(root)root.innerHTML=e.data.html;
  }
});
window.parent.postMessage({type:'buildingReady'},'*');
})();<\/script>`;

function BuildingSlideFrame({
  partialContent, title, theme, scale, slideWidth, slideHeight, nativeW = 1280, nativeH = 720, themeColors,
}: {
  partialContent: string;
  title?: string;
  theme: ThemeName;
  scale: number;
  slideWidth: number;
  slideHeight: number;
  nativeW?: number;
  nativeH?: number;
  themeColors?: ThemeColors;
}) {
  const showSkeleton = partialContent.length < 20;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const readyRef = useRef(false);
  const pendingRef = useRef<string | null>(null);

  // Build the initial empty document once — stable across content updates
  const baseHtml = useMemo(() => {
    const slide = { id: "building", index: 0, title: "", content: "", layout: "content" as const };
    const isDocMode = nativeW === 816;
    const html = buildSlideHtml(slide, theme, undefined, false, themeColors, undefined, false, isDocMode);
    // Inject the bridge script before </body>
    return html.replace("</body>", BUILDING_BRIDGE + "</body>");
  }, [theme, themeColors, nativeW]);

  // Listen for the "ready" signal from the iframe
  useEffect(() => {
    readyRef.current = false;
    function onMsg(e: MessageEvent) {
      if (e.data?.type === "buildingReady" && e.source === iframeRef.current?.contentWindow) {
        readyRef.current = true;
        // Flush any pending content
        if (pendingRef.current !== null) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "updateContent", html: pendingRef.current }, "*"
          );
          pendingRef.current = null;
        }
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [baseHtml]); // re-subscribe if document changes (theme switch)

  // Push content updates via postMessage — rAF batched to coalesce rapid updates
  const rafIdRef = useRef<number>(0);
  const latestContentRef = useRef<string>(partialContent);
  latestContentRef.current = partialContent;

  useEffect(() => {
    if (!readyRef.current) {
      pendingRef.current = partialContent;
      return;
    }
    if (rafIdRef.current) return; // rAF already scheduled
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = 0;
      const content = latestContentRef.current;
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: "updateContent", html: content }, "*"
        );
      }
    });
  }, [partialContent]);

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => { if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); };
  }, []);

  return (
    <div
      style={{
        width: slideWidth,
        height: slideHeight,
        overflow: "hidden",
        background: "#fff",
        boxShadow: "inset 0 0 0 2px var(--accent), 0 4px 24px -4px rgba(0,0,0,0.16)",
        transition: "box-shadow 140ms ease",
        WebkitMaskImage: "-webkit-radial-gradient(white, black)",
        position: "relative",
        isolation: "isolate",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: nativeW, height: nativeH,
          transform: `scale(${scale})`, transformOrigin: "0 0",
          position: "absolute", top: 0, left: 0,
        }}
      >
        <iframe
          ref={iframeRef}
          srcDoc={baseHtml}
          title="Building slide"
          sandbox="allow-scripts allow-same-origin"
          scrolling="no"
          style={{ display: "block", width: nativeW, height: nativeH, border: "none", pointerEvents: "none" }}
        />
      </div>
      {/* Skeleton overlay — visible until real content arrives */}
      {showSkeleton && (
        <div
          style={{
            position: "absolute", inset: 0, zIndex: 2,
            background: "#fff",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 16,
            transition: "opacity 200ms ease",
          }}
        >
          {title && (
            <p style={{
              fontSize: 14 * scale > 10 ? 14 : 10 / scale,
              fontWeight: 600,
              color: "var(--text2)",
              margin: 0,
              transform: `scale(${Math.min(scale * 1.2, 1)})`,
              transformOrigin: "center",
            }}>
              {title}
            </p>
          )}
          <div style={{
            width: "40%", height: 4, borderRadius: 2,
            background: "linear-gradient(90deg, var(--border) 0%, var(--border-hover) 50%, var(--border) 100%)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
          }} />
          <style>{`@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
        </div>
      )}
    </div>
  );
}

// ─── SlideCanvas ───────────────────────────────────────────────────────────────

export const SlideCanvas = forwardRef<SlideCanvasHandle, SlideCanvasProps>(
  function SlideCanvas(
    { slides, theme, logoResult, themeColors, sessionType = "slides", isEditMode, onActiveSlideChange, onSlidesEdited, onAddToChat, onAttachSlide, buildingSlide, onEditHistChange, onRegenerate },
    ref
  ) {
    // Native dimensions: landscape for slides/sheets, portrait for docs
    const NATIVE_W = sessionType === "sheets" ? 1280 : sessionType === "docs" ? 816 : 1280;
    const NATIVE_H = sessionType === "sheets" ? 800 : sessionType === "docs" ? 1056 : 720;

    const scrollRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(800);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [hoveredSlideId, setHoveredSlideId] = useState<string | null>(null);

    // Map of slideId → edit iframe element (only populated when isEditMode=true)
    const editIframeMap = useRef<Map<string, HTMLIFrameElement>>(new Map());
    // Last iframe the user interacted with — target for Cmd+Z
    const lastActiveIframe = useRef<HTMLIFrameElement | null>(null);
    const slidesRef = useRef(slides);
    const onSlidesEditedRef = useRef(onSlidesEdited);
    const onEditHistChangeRef = useRef(onEditHistChange);
    slidesRef.current = slides;
    onSlidesEditedRef.current = onSlidesEdited;
    onEditHistChangeRef.current = onEditHistChange;

    // Track the newest slide ID for entrance animation
    const prevSlideCountRef = useRef(slides.length);
    const newestSlideIdRef = useRef<string | null>(null);
    if (slides.length > prevSlideCountRef.current) {
      newestSlideIdRef.current = slides[slides.length - 1]?.id ?? null;
    }
    prevSlideCountRef.current = slides.length;

    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      function measure() {
        if (!el) return;
        const w = el.clientWidth;
        if (w > 0) setContainerWidth(w);
      }
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      measure();
      return () => ro.disconnect();
    }, []);

    // Track which iframe is active + relay histstate to parent
    useEffect(() => {
      if (!isEditMode) return;
      function onMsg(e: MessageEvent) {
        const d = e.data;
        if (!d?.type) return;
        // Track last active iframe for both slides and docs modes
        if (d.type === "docSelState" || d.type === "histstate" || d.type === "select" || d.type === "textchange") {
          for (const [, iframe] of editIframeMap.current) {
            if (e.source === iframe.contentWindow) {
              lastActiveIframe.current = iframe;
              break;
            }
          }
        }
        // Relay undo/redo availability to parent
        if (d.type === "histstate") {
          onEditHistChangeRef.current?.(d.canUndo as boolean, d.canRedo as boolean);
        }
      }
      window.addEventListener("message", onMsg);
      return () => window.removeEventListener("message", onMsg);
    }, [isEditMode]);

    // Cmd/Ctrl+Z / Cmd+Shift+Z — undo/redo inside the active edit iframe
    useEffect(() => {
      if (!isEditMode) return;
      function onKeyDown(e: KeyboardEvent) {
        if ((e.metaKey || e.ctrlKey) && e.key === "z") {
          const iframe = lastActiveIframe.current;
          if (iframe) {
            e.preventDefault();
            iframe.contentWindow?.postMessage({ type: e.shiftKey ? "redo" : "undo" }, "*");
          }
        }
      }
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [isEditMode]);

    // Expose saveAll / undoInEdit / redoInEdit to parent via ref
    useImperativeHandle(ref, () => ({
      undoInEdit: () => {
        lastActiveIframe.current?.contentWindow?.postMessage({ type: "undo" }, "*");
      },
      redoInEdit: () => {
        lastActiveIframe.current?.contentWindow?.postMessage({ type: "redo" }, "*");
      },
      saveAll: () => {
        void (async () => {
          const updates: Array<{ id: string; content: string }> = [];
          for (const slide of slidesRef.current) {
            const iframe = editIframeMap.current.get(slide.id);
            if (!iframe) continue;
            const iframeEl = iframe; // capture for closure
            const html = await new Promise<string>((resolve) => {
              const timer = setTimeout(() => {
                window.removeEventListener("message", onMsg);
                resolve("");
              }, 3000);
              function onMsg(e: MessageEvent) {
                if (e.source !== iframeEl.contentWindow) return;
                if (e.data?.type === "html") {
                  clearTimeout(timer);
                  window.removeEventListener("message", onMsg);
                  resolve(e.data.html as string);
                }
              }
              window.addEventListener("message", onMsg);
              iframe.contentWindow?.postMessage({ type: "getHTML" }, "*");
            });
            if (!html) continue;
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const root = doc.querySelector(".slide-root");
            const content = root?.innerHTML?.trim() ?? doc.body?.innerHTML?.trim() ?? "";
            if (content) updates.push({ id: slide.id, content });
          }
          onSlidesEditedRef.current?.(updates);
        })();
      },
    }), []);

    const SLIDE_PADDING_X = 24;
    const SLIDE_GAP = 16;
    const SLIDE_PADDING_TOP = 16;

    const slideWidth = Math.max(containerWidth - SLIDE_PADDING_X * 2, 0);
    const scale = slideWidth / NATIVE_W;
    const slideHeight = Math.round(NATIVE_H * scale);

    // Virtualization: track which slides are in viewport
    const [visibleRange, setVisibleRange] = useState<[number, number]>([0, 10]);
    useEffect(() => {
      const el = scrollRef.current;
      if (!el || slideHeight <= 0) return;
      let rafId = 0;
      function updateRange() {
        rafId = 0;
        if (!el) return;
        const itemH = slideHeight + SLIDE_GAP;
        const first = Math.floor((el.scrollTop - SLIDE_PADDING_TOP) / itemH);
        const visible = Math.ceil(el.clientHeight / itemH);
        const last = first + visible;
        setVisibleRange([Math.max(0, first - 1), last + 1]);
      }
      function onScroll() {
        if (!rafId) rafId = requestAnimationFrame(updateRange);
      }
      el.addEventListener("scroll", onScroll, { passive: true });
      updateRange();
      return () => {
        el.removeEventListener("scroll", onScroll);
        if (rafId) cancelAnimationFrame(rafId);
      };
    }, [slideHeight]);

    // Auto-scroll to building slide when a new one starts
    useEffect(() => {
      if (buildingSlide && scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      }
    }, [buildingSlide?.toolUseId]); // Only on new slide, not every content update

    const handleSlideClick = useCallback((slideId: string) => {
      setActiveId(slideId);
      onActiveSlideChange?.(slideId);
    }, [onActiveSlideChange]);

    const handleRegisterIframe = useCallback((slideId: string, el: HTMLIFrameElement | null) => {
      if (el) {
        editIframeMap.current.set(slideId, el);
        // Auto-select first registered iframe so undo works without requiring a click first
        if (!lastActiveIframe.current) lastActiveIframe.current = el;
      } else {
        editIframeMap.current.delete(slideId);
      }
    }, []);

    return (
      <div
        ref={scrollRef}
        className="absolute inset-0 overflow-y-auto [&::-webkit-scrollbar]:hidden"
        style={{ background: "var(--bg2)", scrollbarWidth: "none" }}
      >
        {slides.length === 0 && !buildingSlide ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div style={{ position: "relative", width: 120, height: 70 }}>
              <div style={{ position: "absolute", top: 10, left: 7, width: 106, height: 60, borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg)" }} />
              <div style={{ position: "absolute", top: 5, left: 3, width: 114, height: 64, borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg)" }} />
              <div style={{ position: "absolute", top: 0, left: 0, width: 120, height: 68, borderRadius: 5, border: "1px solid var(--border-hover)", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", gap: 6, padding: "0 14px" }}>
                <div style={{ width: 48, height: 2.5, borderRadius: 999, background: "var(--border-hover)" }} />
                <div style={{ width: 30, height: 2, borderRadius: 999, background: "var(--border)" }} />
                <div style={{ width: 40, height: 2, borderRadius: 999, background: "var(--border)" }} />
              </div>
            </div>
            <p style={{ fontSize: 12.5, color: "var(--text3)", letterSpacing: "-0.01em", fontWeight: 400 }}>
              {sessionType === "sheets" ? "Spreadsheet will appear here as the agent creates it" : sessionType === "docs" ? "Pages will appear here as the agent creates them" : "Slides will appear here as the agent creates them"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: SLIDE_GAP, paddingLeft: SLIDE_PADDING_X, paddingRight: SLIDE_PADDING_X, paddingTop: SLIDE_PADDING_TOP, paddingBottom: 48 }}>
            {/* Docs formatting toolbar — sticky at top, only in edit mode */}
            {sessionType === "docs" && isEditMode && (
              <DocFormatBar lastActiveIframe={lastActiveIframe} />
            )}
            {slides.map((slide, i) => {
              const isNewest = slide.id === newestSlideIdRef.current;
              // Virtualization: skip rendering iframes for offscreen slides (disabled in edit mode)
              const isVisible = isEditMode || (i >= visibleRange[0] && i <= visibleRange[1]);

              if (!isVisible) {
                return (
                  <div
                    key={slide.id}
                    style={{
                      width: slideWidth,
                      height: slideHeight,
                      background: "var(--bg)",
                      borderRadius: "var(--r-lg)",
                      border: "1px solid var(--border)",
                      flexShrink: 0,
                    }}
                  />
                );
              }

              const frame = (
                <SlideFrame
                  key={slide.id}
                  slide={slide}
                  theme={theme}
                  scale={scale}
                  slideWidth={slideWidth}
                  slideHeight={slideHeight}
                  nativeW={NATIVE_W}
                  nativeH={NATIVE_H}
                  isDoc={sessionType === "docs"}
                  isActive={!isEditMode && (activeId === slide.id || (activeId === null && i === 0))}
                  onClick={() => handleSlideClick(slide.id)}
                  logoResult={logoResult}
                  isFirstSlide={i === 0}
                  themeColors={themeColors}
                  isEditing={!!isEditMode}
                  onRegisterIframe={handleRegisterIframe}
                  onBecomeActive={() => {
                    const iframe = editIframeMap.current.get(slide.id);
                    if (iframe) lastActiveIframe.current = iframe;
                  }}
                  onAddToChat={onAddToChat}
                />
              );
              const isHovered = hoveredSlideId === slide.id;
              const cardWrapper = (children: React.ReactNode) => (
                <div
                  style={{ position: "relative" }}
                  onMouseEnter={() => { if (!isEditMode) setHoveredSlideId(slide.id); }}
                  onMouseLeave={() => setHoveredSlideId(null)}
                >
                  {children}
                  {!isEditMode && isHovered && (onRegenerate || onAttachSlide) && (
                    <div style={{
                      position: "absolute", top: 10, right: 10, zIndex: 10,
                      display: "flex", gap: 6,
                    }}>
                      {onRegenerate && (
                        <RegenerateButton
                          visible={isHovered}
                          inline
                          onSelect={(code, text) => onRegenerate(slide, code, text)}
                        />
                      )}
                      {onAttachSlide && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onAttachSlide(slide); }}
                          style={{
                            display: "flex", alignItems: "center", gap: 5,
                            height: 28, padding: "0 10px",
                            borderRadius: "var(--r-md)",
                            border: "1px solid var(--border-hover)",
                            background: "var(--bg)",
                            color: "var(--text2)",
                            fontSize: 12, fontWeight: 500,
                            cursor: "pointer",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                            letterSpacing: "-0.01em",
                            transition: "border-color 120ms, color 120ms, background 120ms",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "var(--accent)";
                            e.currentTarget.style.color = "var(--accent-text)";
                            e.currentTarget.style.background = "var(--accent-soft)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "var(--border-hover)";
                            e.currentTarget.style.color = "var(--text2)";
                            e.currentTarget.style.background = "var(--bg)";
                          }}
                        >
                          <HugeiconsIcon icon={MessageAdd01Icon} size={14} />
                          Add to chat
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );

              return isNewest ? (
                <motion.div
                  key={`motion-${slide.id}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  onAnimationComplete={() => { newestSlideIdRef.current = null; }}
                >
                  {cardWrapper(frame)}
                </motion.div>
              ) : (
                <div key={slide.id}>{cardWrapper(frame)}</div>
              );
            })}
            {/* Building slide preview — with exit animation */}
            <AnimatePresence>
              {buildingSlide && (
                <motion.div
                  key={`building-${buildingSlide.toolUseId}`}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                >
                  <BuildingSlideFrame
                    partialContent={buildingSlide.partialContent}
                    title={buildingSlide.title}
                    theme={theme}
                    scale={scale}
                    slideWidth={slideWidth}
                    slideHeight={slideHeight}
                    nativeW={NATIVE_W}
                    nativeH={NATIVE_H}
                    themeColors={themeColors}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Edit mode bottom hint */}
        {isEditMode && slides.length > 0 && (
          <div style={{
            position: "sticky", bottom: 0,
            display: "flex", justifyContent: "center",
            padding: "8px 0 12px",
            background: "linear-gradient(to bottom, transparent, var(--bg2))",
            pointerEvents: "none",
          }}>
            <span style={{
              fontSize: 11, color: "var(--text3)", letterSpacing: "0.01em",
              background: "var(--bg)", border: "1px solid var(--border)",
              borderRadius: 999, padding: "3px 10px",
            }}>
              Click any element to select · Drag to move · ⌘Z to undo
            </span>
          </div>
        )}
      </div>
    );
  }
);
