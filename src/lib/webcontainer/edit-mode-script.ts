/**
 * Vanilla JS injected into every WebContainer preview to enable click-to-edit.
 *
 * UX contract:
 *   - Alt + hover outlines the element under the cursor.
 *   - Alt + click posts a message to the parent window with a selector + text.
 *   - Parent (WebsiteCanvas.tsx) listens and pre-fills the chat input.
 *
 * Must be plain ES5+ (no TS, no imports) — runs inside the iframe's document,
 * which is a different origin from the editor. Cross-origin messaging via
 * `window.parent.postMessage` is allowed by the browser; the listener in the
 * editor verifies `event.data.source === "opensl-edit"` before trusting.
 *
 * Served at `/__opensl-edit.js` from both `public/` (Vite) and root (serve).
 */
export const EDIT_MODE_SCRIPT = `
(function() {
  if (window.__openslEditInjected) return;
  window.__openslEditInjected = true;

  var HOVER_CLASS = '__opensl-hover-outline';
  var style = document.createElement('style');
  style.textContent =
    '.' + HOVER_CLASS + ' {' +
      'outline: 2px dashed #4338CA !important;' +
      'outline-offset: 2px !important;' +
      'cursor: pointer !important;' +
      'transition: outline-color 80ms ease-out;' +
    '}' +
    '.' + HOVER_CLASS + '::after {' +
      'content: "Alt+click to edit";' +
      'position: fixed;' +
      'top: 8px;' +
      'right: 8px;' +
      'background: #4338CA;' +
      'color: white;' +
      'font: 600 11px system-ui, sans-serif;' +
      'padding: 4px 8px;' +
      'border-radius: 6px;' +
      'pointer-events: none;' +
      'z-index: 2147483647;' +
    '}';
  document.head.appendChild(style);

  var lastHovered = null;

  function clearHover() {
    if (lastHovered) {
      lastHovered.classList.remove(HOVER_CLASS);
      lastHovered = null;
    }
  }

  document.addEventListener('mousemove', function(e) {
    if (!e.altKey) { clearHover(); return; }
    var target = e.target;
    if (!target || target === document.body || target === document.documentElement) { clearHover(); return; }
    if (target === lastHovered) return;
    clearHover();
    target.classList.add(HOVER_CLASS);
    lastHovered = target;
  }, true);

  document.addEventListener('keyup', function(e) {
    if (e.key === 'Alt' || e.altKey === false) clearHover();
  }, true);

  document.addEventListener('click', function(e) {
    if (!e.altKey) return;
    e.preventDefault();
    e.stopPropagation();
    var target = e.target;
    if (!target) return;

    var selector = computeSelector(target);
    var text = ((target.textContent || '') + '').trim().slice(0, 200);
    var tag = target.tagName.toLowerCase();
    clearHover();

    try {
      window.parent.postMessage({
        source: 'opensl-edit',
        kind: 'element-click',
        selector: selector,
        text: text,
        tag: tag,
      }, '*');
    } catch (err) {
      // parent may be gone — swallow
    }
  }, true);

  function computeSelector(el) {
    if (!el || el.nodeType !== 1) return '';
    if (el === document.body) return 'body';
    var parts = [];
    var cur = el;
    var depth = 0;
    while (cur && cur !== document.body && depth < 6) {
      var part = cur.tagName.toLowerCase();
      if (cur.id) {
        part += '#' + cur.id;
        parts.unshift(part);
        break;
      }
      var parent = cur.parentElement;
      if (parent) {
        var sibs = [];
        for (var i = 0; i < parent.children.length; i++) {
          if (parent.children[i].tagName === cur.tagName) sibs.push(parent.children[i]);
        }
        if (sibs.length > 1) {
          part += ':nth-of-type(' + (sibs.indexOf(cur) + 1) + ')';
        }
      }
      parts.unshift(part);
      cur = cur.parentElement;
      depth++;
    }
    return parts.join(' > ');
  }
})();
`;
