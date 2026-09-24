/**
 * Clean Paste for Translate — popup.
 *
 * Toggle for automatic cleaning on translator sites, plus a manual
 * "paste here, copy the result" box that works for any destination.
 */
'use strict';

const $ = (id) => document.getElementById(id);
const t = (key) => chrome.i18n.getMessage(key);

// Localize every element that carries a data-i18n* attribute.
document.documentElement.lang = chrome.i18n.getUILanguage();
for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
for (const el of document.querySelectorAll('[data-i18n-placeholder]')) {
  el.placeholder = t(el.dataset.i18nPlaceholder);
}
for (const el of document.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);

const toggle = $('enabled');
const input = $('input');
const status = $('status');

chrome.storage.sync.get({ enabled: true }, (s) => (toggle.checked = s.enabled));
toggle.addEventListener('change', () => chrome.storage.sync.set({ enabled: toggle.checked }));

function processInput() {
  const raw = input.value;
  if (!raw.trim()) {
    status.textContent = '';
    return;
  }
  const cleaned = CleanPaste.clean(raw);
  if (cleaned !== raw) {
    input.value = cleaned;
    status.textContent = t('statusJoined');
  }
}

// Clean automatically right after a paste.
input.addEventListener('paste', () => setTimeout(processInput, 0));

$('copy').addEventListener('click', async () => {
  processInput();
  if (!input.value) return;
  await navigator.clipboard.writeText(input.value);
  status.textContent = t('statusCopied');
});

$('clear').addEventListener('click', () => {
  input.value = '';
  status.textContent = '';
  input.focus();
});

input.focus();
