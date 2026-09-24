/**
 * Clean Paste for Translate — core text-cleaning logic.
 *
 * Text copied from a PDF has a hard line break at the end of every visual
 * line. This module rejoins those lines into real paragraphs while keeping
 * genuine paragraph breaks, headings and list items intact.
 *
 * Shared by the content script, the popup and the Node test suite.
 */
(function (root) {
  'use strict';

  // CJK ideographs, kana, full-width forms and CJK punctuation.
  const CJK = /[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u3000-\u303F]/;

  // Sentence-final punctuation, optionally followed by closing quotes/brackets.
  const SENTENCE_END = /[.!?。！？…:：;；]["'”’)）」』】]*$/;

  // Start of a list item: bullets, "1.", "1)", "(1)", "（一）", "a)", "一、" …
  const LIST_START =
    /^([•·●○▪■◦‣\-–—*]\s|\(?\d{1,3}[.)、]\s?|[（(][0-9一二三四五六七八九十]{1,3}[)）]|[a-zA-Z][.)]\s|[一二三四五六七八九十]{1,3}、)/;

  // Approximate glyph widths for a proportional font (1 = average Latin letter).
  const NARROW = /[iljftrI.,;:'!|()[\]\s1]/;
  const WIDE = /[mwMW@%]/;

  /** Estimated rendered width of a string, in "average letter" units. */
  function visualWidth(s) {
    let w = 0;
    for (const ch of s) {
      if (CJK.test(ch)) w += 2;
      else if (NARROW.test(ch)) w += 0.5;
      else if (WIDE.test(ch)) w += 1.4;
      else if (/\p{Lu}/u.test(ch)) w += 1.2;
      else w += 1;
    }
    return w;
  }

  /** First word of a line (for CJK text: the first character). */
  function firstToken(s) {
    if (CJK.test(s.charAt(0))) return s.charAt(0);
    return (s.match(/^\S+/) || [''])[0];
  }

  function percentile(arr, p) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(p * (sorted.length - 1)))];
  }

  // ---------------------------------------------------------------------------
  // Hyphenation
  // ---------------------------------------------------------------------------

  // A line-final hyphen followed by one of these words is a suspended hyphen:
  // "Ein- und Ausgang", "pre- and post-processing". Keep hyphen and space.
  const SUSPENDED = /^(und|oder|bzw\.?|sowie|bis|als|and|or|to|nor)(\s|$)/i;

  // English prefixes that are normally written with a hyphen (self-aware, non-linear).
  const KEEP_PREFIX = /^(self|non|well|half|cross|quasi)$/i;
  // …unless what follows is really a suffix (self-ish → selfish).
  const SUFFIX = /^(ish|less|ness|ly|ed|ing)\b/i;

  /**
   * Collect words seen elsewhere in the text, split into those written
   * without a hyphen ("information") and hyphenated pairs ("well-known").
   * Used as evidence when deciding how to rejoin a hyphenated line break.
   */
  function buildVocab(text) {
    const plain = new Set();
    const hyph = new Set();
    for (const line of text.split('\n')) {
      // Ignore the fragment broken off at the end of the line.
      const body = line.replace(/[-\u00AD]\s*$/, '');
      for (const m of body.matchAll(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu)) {
        const w = m[0].toLowerCase();
        if (w.includes('-')) {
          w.split('-').reduce((a, b) => (hyph.add(a + '-' + b), b));
        } else {
          plain.add(w);
        }
      }
    }
    return { plain, hyph };
  }

  /**
   * Join two lines when the first one ends with a hyphen. Decides between
   * dropping the hyphen (typesetting break), keeping it (a real compound),
   * or keeping it plus a space (suspended hyphen).
   */
  function joinHyphen(prev, cur, vocab) {
    // Soft hyphens are always typesetting artefacts.
    if (prev.endsWith('\u00AD')) return prev.slice(0, -1) + cur;

    const frag = (prev.match(/([\p{L}\p{N}]+)-$/u) || [])[1] || '';
    const next = (cur.match(/^[\p{L}\p{N}]+/u) || [''])[0];

    // Ein- und Ausgang
    if (SUSPENDED.test(cur)) return prev + ' ' + cur;
    // E-Mail, COVID-19, Max-Planck
    if (/^[\p{Lu}\p{N}]/u.test(cur)) return prev + cur;
    // e-mail, 10-fach, UV-light
    if (frag.length === 1 || /^\p{N}+$/u.test(frag) || /^\p{Lu}{2,}$/u.test(frag)) {
      return prev + cur;
    }

    // Look for the same word elsewhere in the text.
    const seenPlain = vocab.plain.has((frag + next).toLowerCase());
    const seenHyph = vocab.hyph.has((frag + '-' + next).toLowerCase());
    if (seenHyph && !seenPlain) return prev + cur;
    if (seenPlain) return prev.slice(0, -1) + cur;

    // self-aware, non-linear
    if (KEEP_PREFIX.test(frag) && next.length >= 3 && !SUFFIX.test(next)) {
      return prev + cur;
    }

    // Ordinary hyphenation: frag- / ments → fragments
    return prev.slice(0, -1) + cur;
  }

  /** Join two consecutive lines of the same paragraph. */
  function joinPair(prev, cur, vocab) {
    if (/[\p{L}\p{N}][-\u00AD]$/u.test(prev) && /^[\p{L}\p{N}]/u.test(cur)) {
      return joinHyphen(prev, cur, vocab);
    }
    // No space between CJK characters; a single space otherwise.
    if (CJK.test(prev.slice(-1)) || CJK.test(cur.charAt(0))) return prev + cur;
    return prev + ' ' + cur;
  }

  // ---------------------------------------------------------------------------
  // Main entry point
  // ---------------------------------------------------------------------------

  /**
   * Rejoin hard-wrapped lines into paragraphs.
   * Paragraphs in the result are separated by a blank line.
   *
   * @param {string} raw Text as copied from a PDF.
   * @returns {string}
   */
  function clean(raw) {
    const lines = raw.replace(/\r\n?/g, '\n').replace(/\u00A0/g, ' ').split('\n');
    const items = lines.map((l) => ({
      indent: /^( {2,}|\t|\u3000)/.test(l),
      text: l.trim().replace(/[ \t]*\t[ \t]*/g, ' '),
    }));

    const vocab = buildVocab(items.map((i) => i.text).join('\n'));
    const widths = items.filter((i) => i.text).map((i) => visualWidth(i.text));
    // Width-based rules need a few lines to estimate the column width.
    const useWidthRules = widths.length >= 3;
    const columnWidth = percentile(widths, 0.9);

    const paragraphs = [];
    let current = '';
    let prevItem = null;

    const flush = () => {
      if (current) paragraphs.push(current);
      current = '';
    };

    for (const item of items) {
      if (!item.text) {
        // An empty line always ends the paragraph.
        flush();
        prevItem = null;
        continue;
      }
      if (!current) {
        current = item.text;
        prevItem = item;
        continue;
      }

      const prevText = prevItem.text;
      const prevWidth = visualWidth(prevText);

      // Typesetting only wraps a line when the next word does not fit.
      // If the first word of this line would have fitted on the previous one,
      // the break was intentional: end of a paragraph, a heading, etc.
      const nextWordFits =
        useWidthRules &&
        !/[-\u00AD]$/.test(prevText) &&
        prevWidth + 0.5 + visualWidth(firstToken(item.text)) <= columnWidth * 0.9;

      const startsNewParagraph =
        LIST_START.test(item.text) ||
        (item.indent && !prevItem.indent) ||
        nextWordFits ||
        (useWidthRules && SENTENCE_END.test(prevText) && prevWidth < columnWidth * 0.75);

      if (startsNewParagraph) {
        flush();
        current = item.text;
      } else {
        current = joinPair(current, item.text, vocab);
      }
      prevItem = item;
    }
    flush();
    return paragraphs.join('\n\n');
  }

  root.CleanPaste = { clean };
  if (typeof module !== 'undefined' && module.exports) module.exports = { clean };
})(typeof window !== 'undefined' ? window : globalThis);
