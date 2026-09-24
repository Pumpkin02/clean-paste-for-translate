/**
 * Clean Paste for Translate — content script.
 *
 * Intercepts paste events on supported translator sites and replaces the
 * pasted text with the cleaned version from clean.js.
 */
(function () {
  'use strict';

  let enabled = true;
  // Set by Ctrl/Cmd+Shift+V: paste the next clipboard content unchanged.
  let rawNext = false;

  chrome.storage.sync.get({ enabled: true }, (s) => (enabled = s.enabled));
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.enabled) enabled = changes.enabled.newValue;
  });

  document.addEventListener(
    'keydown',
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'v') {
        rawNext = true;
        setTimeout(() => (rawNext = false), 500);
      }
    },
    true
  );

  function isMultilineEditor(el) {
    if (!el) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') return false; // single-line inputs are left alone
    return el.isContentEditable;
  }

  document.addEventListener(
    'paste',
    (e) => {
      if (!enabled) return;
      if (rawNext) {
        rawNext = false;
        return;
      }
      const target = e.target.nodeType === 1 ? e.target : e.target.parentElement;
      if (!isMultilineEditor(target)) return;

      const raw = e.clipboardData && e.clipboardData.getData('text/plain');
      if (!raw || !raw.includes('\n')) return;

      const cleaned = window.CleanPaste.clean(raw);
      if (cleaned === raw) return;

      e.preventDefault();
      e.stopImmediatePropagation();

      // execCommand('insertText') notifies the page's framework (React etc.)
      // and keeps Ctrl+Z working. Fall back to setting the value directly.
      const inserted = document.execCommand('insertText', false, cleaned);
      if (!inserted && target.tagName === 'TEXTAREA') {
        const { selectionStart: start, selectionEnd: end, value } = target;
        target.value = value.slice(0, start) + cleaned + value.slice(end);
        target.selectionStart = target.selectionEnd = start + cleaned.length;
        target.dispatchEvent(new Event('input', { bubbles: true }));
      }

      const linesBefore = raw.split('\n').filter((l) => l.trim()).length;
      const paragraphsAfter = cleaned.split('\n\n').length;
      const key = paragraphsAfter === 1 ? 'toastJoinedSingle' : 'toastJoined';
      showToast(chrome.i18n.getMessage(key, [String(linesBefore), String(paragraphsAfter)]));
    },
    true
  );

  function showToast(message) {
    if (window.top !== window || !message) return;
    const el = document.createElement('div');
    el.textContent = message;
    Object.assign(el.style, {
      position: 'fixed',
      left: '50%',
      bottom: '24px',
      transform: 'translateX(-50%)',
      background: 'rgba(32,33,36,.92)',
      color: '#fff',
      font: '13px/1.4 system-ui, sans-serif',
      padding: '8px 14px',
      borderRadius: '8px',
      zIndex: 2147483647,
      boxShadow: '0 2px 10px rgba(0,0,0,.25)',
      transition: 'opacity .3s',
      pointerEvents: 'none',
    });
    document.body.appendChild(el);
    setTimeout(() => (el.style.opacity = '0'), 2600);
    setTimeout(() => el.remove(), 3000);
  }
})();
