// Unit tests for extension/src/clean.js — run with `npm test` (Node 18+, no dependencies).
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { clean } = require('../extension/src/clean.js');

const paragraphs = (text) => clean(text).split('\n\n');

test('joins English lines with a space and removes hyphenation', () => {
  const input = [
    'Machine translation systems work best when each input',
    'segment contains a complete sentence. When text is copied',
    'from a PDF, however, every visual line ends with a hard',
    'break, so sentences are split into frag-',
    'ments that are translated separately.',
  ].join('\n');
  assert.equal(
    clean(input),
    'Machine translation systems work best when each input segment contains a complete ' +
      'sentence. When text is copied from a PDF, however, every visual line ends with a hard ' +
      'break, so sentences are split into fragments that are translated separately.'
  );
});

test('joins Chinese lines without adding spaces', () => {
  const input = [
    '机器翻译系统在每个输入片段都包含完整句子时效果最好。但从',
    '文档中复制文本时，每一行末尾都会带有硬换行，导致句子被切成',
    '多个片段分别翻译。',
  ].join('\n');
  assert.equal(
    clean(input),
    '机器翻译系统在每个输入片段都包含完整句子时效果最好。但从文档中复制文本时，每一行末尾都会带有硬换行，导致句子被切成多个片段分别翻译。'
  );
});

test('keeps blank lines, list items and indented lines as paragraph starts', () => {
  const input = [
    'First paragraph line one that is long enough to be',
    'a normal line of text in the column.',
    '',
    '• First bullet item that is fairly long and wraps onto',
    'the following line of the document.',
    '• Second bullet.',
  ].join('\n');
  assert.deepEqual(paragraphs(input), [
    'First paragraph line one that is long enough to be a normal line of text in the column.',
    '• First bullet item that is fairly long and wraps onto the following line of the document.',
    '• Second bullet.',
  ]);
});

test('detects paragraph breaks without blank lines (next word would have fitted)', () => {
  // Justified text: the last line of the first paragraph is fairly long,
  // but "Im" would still have fitted on it, so it must be a paragraph break.
  const input = [
    '2.\tGrundlagen',
    '2.1\tBegriffe und Abgrenzung',
    'Ein Werkzeug zur Textbereinigung muss erkennen, wo ein Satz nur wegen der Zeilenbreite',
    'umgebrochen wurde und wo der Autor bewusst einen neuen Absatz begonnen hat. Beide Fälle',
    'sehen im kopierten Text zunächst identisch aus, denn jede Zeile endet mit einem Umbruch.',
    'Entscheidend ist daher die Länge der Zeile im Verhältnis zur Spalte.',
    'Im zweiten Absatz wird dieselbe Regel angewendet, und auch hier soll der Übergang',
    'zwischen zwei Zeilen innerhalb eines Satzes ohne sichtbaren Bruch zusammengefügt werden,',
    'während die Grenze zum vorherigen Absatz erhalten bleibt, wie es beim Lesen erwartet wird.',
  ].join('\n');
  const result = paragraphs(input);
  assert.equal(result.length, 4);
  assert.equal(result[0], '2. Grundlagen');
  assert.equal(result[1], '2.1 Begriffe und Abgrenzung');
  assert.match(result[2], /^Ein Werkzeug .* Spalte\.$/);
  assert.match(result[3], /^Im zweiten Absatz .* erwartet wird\.$/);
});

test('keeps hyphens that belong to the word', () => {
  assert.equal(clean('Bitte schicken Sie uns eine E-\nMail mit den Unterlagen.'),
    'Bitte schicken Sie uns eine E-Mail mit den Unterlagen.');
  assert.equal(clean('Das Max-\nPlanck-Institut hat Ein-\nund Ausgänge sowie COVID-\n19 Daten.'),
    'Das Max-Planck-Institut hat Ein- und Ausgänge sowie COVID-19 Daten.');
  assert.equal(clean('A self-\naware system with a well-\nknown e-\nmail feature and frag-\nments.'),
    'A self-aware system with a well-known e-mail feature and fragments.');
  assert.equal(clean('Die Verarbei-\ntung der Da-\nten erfolgt 10-\nfach schneller.'),
    'Die Verarbeitung der Daten erfolgt 10-fach schneller.');
});

test('uses the rest of the text as evidence for hyphenation', () => {
  assert.equal(
    clean('This is a state-of-the-art model. We use a state-of-the-\nart approach.'),
    'This is a state-of-the-art model. We use a state-of-the-art approach.'
  );
  assert.equal(
    clean('The infor-\nmation is useful. More information follows.'),
    'The information is useful. More information follows.'
  );
  assert.equal(clean('They are self-\nish.'), 'They are selfish.');
});

test('normalises Windows line endings and non-breaking spaces', () => {
  assert.equal(clean('one\r\ntwo\u00A0three'), 'one two three');
});

test('leaves single-line text unchanged', () => {
  assert.equal(clean('Just one line.'), 'Just one line.');
});
