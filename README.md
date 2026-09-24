# Clean Paste for Translate

> Paste text copied from a PDF into Google Translate, DeepL & co. and get whole paragraphs, not broken lines.

[中文说明](README.zh-CN.md)

A small Chrome / Edge extension that fixes the most annoying part of translating PDFs:
when you copy text out of a PDF, **every visual line ends with a hard line break**, so
Google Translate, DeepL and friends treat each line as its own paragraph and translate
half-sentences.

Clean Paste for Translate hooks into the paste event on translator sites and rejoins the lines
into real paragraphs before the text reaches the translator, while keeping genuine
paragraph breaks, headings and list items.

```
Before (as copied from the PDF)            After (what gets pasted)
─────────────────────────────────          ─────────────────────────────────────
2 Background                               2 Background
Every line of this paragraph was
wrapped by the PDF layout, so a       →    Every line of this paragraph was
translator sees four separate              wrapped by the PDF layout, so a
pieces instead of one sen-                 translator sees four separate pieces
tence.                                     instead of one sentence.
```

## Features

- **Automatic** on Google Translate, DeepL, Baidu Translate, Youdao and Bing Translator:
  just paste with <kbd>Ctrl</kbd>+<kbd>V</kbd>.
- **Keeps real paragraphs**: detects paragraph ends and headings even when the PDF has
  no blank lines between paragraphs (see [How it works](#how-it-works)).
- **Smart hyphenation**: `frag-`/`ments` → `fragments`, but `E-`/`Mail` → `E-Mail`,
  `COVID-`/`19` → `COVID-19`, `Ein-`/`und Ausgang` → `Ein- und Ausgang`.
- **CJK aware**: joins Chinese/Japanese lines without inserting spaces.
- **Undo & bypass**: <kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes the cleaned paste;
  <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> pastes the original text unchanged.
- **Manual mode**: the toolbar popup has a box that cleans any text so you can copy it
  anywhere else.
- **Private**: no network requests, no analytics. The only permission is `storage`
  (to remember the on/off switch).
- UI in English, German and Chinese.

## Installation

### From source (developer mode)

1. Download this repository (**Code → Download ZIP**) and unzip it, or `git clone` it.
2. Open `chrome://extensions` (Edge: `edge://extensions`).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the `extension` folder.
5. Optional: pin the extension from the puzzle-piece menu.

## Usage

Copy text from a PDF and paste it into one of the supported translator sites.
A short notice at the bottom of the page tells you how many lines were joined.

| Shortcut | Effect |
| --- | --- |
| <kbd>Ctrl</kbd>+<kbd>V</kbd> | Paste with line breaks joined |
| <kbd>Ctrl</kbd>+<kbd>Z</kbd> | Undo the cleaned paste |
| <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> | Paste the original text unchanged |

Click the toolbar icon to switch automatic cleaning on or off, or to clean text manually.

## How it works

All logic lives in [`extension/src/clean.js`](extension/src/clean.js).

1. **Paragraph detection.** Text layout only wraps a line when the next word does not
   fit. So if the first word of a line *would* have fitted at the end of the previous
   line, that break was intentional: the end of a paragraph, a heading, and so on.
   Line widths are estimated with approximate glyph widths and compared to the column
   width (90th percentile of all lines). Blank lines, indented lines and list markers
   (`•`, `1.`, `(1)`, `一、` …) also start a new paragraph.
2. **Joining.** Lines inside a paragraph are joined with a space, or with no space
   between CJK characters.
3. **Hyphenation.** When a line ends in a hyphen, the extension decides between
   removing it (`frag-ments`), keeping it (`E-Mail`, `self-aware`, `10-fach`) or
   keeping it with a space (`Ein- und Ausgang`). If unsure, it looks for the same word
   elsewhere in the pasted text.

## Adding another site

Add the site's URL pattern to `content_scripts.matches` in
[`extension/manifest.json`](extension/manifest.json) and reload the extension.
Pull requests for more translators are welcome.

## Development

```bash
npm test          # run the unit tests (Node 18+, no dependencies)
npm run package   # build clean-paste-for-translate.zip for the Chrome Web Store
```

```
extension/
├── manifest.json
├── _locales/        # en, de, zh_CN UI strings
├── icons/
└── src/
    ├── clean.js     # line-joining logic (shared by content script, popup and tests)
    ├── content.js   # paste interception on translator sites
    ├── popup.html / popup.css / popup.js
test/
└── clean.test.js
```

## Known limitations

- Line widths are estimated from characters, not measured from the PDF, so text that
  wraps around an image (shorter lines) may be split into extra paragraphs.
- A rare word hyphenated at a line end that appears nowhere else in the text is treated
  as ordinary hyphenation, so a genuine hyphen may be dropped.
- Multi-column PDFs sometimes copy in the wrong order; that has to be fixed in the PDF
  viewer.

## Related projects

- [CopyTranslator](https://github.com/CopyTranslator/CopyTranslator): desktop app that
  translates the clipboard and also removes extra line breaks.
- [pdfcopy](https://pdfcopy.github.io/): web page that removes line breaks from copied
  PDF text.

## License

[MIT](LICENSE)
