# Privacy Policy — Clean Paste for Translate

_Last updated: 24 September 2026_

Clean Paste for Translate does **not** collect, store, sell or transmit any personal data.

## What the extension does with your text

- When you paste text on a supported translator site, the extension reads the pasted
  text from the clipboard event, cleans the line breaks **locally in your browser**,
  and inserts the result into the text box you pasted into.
- Text you enter in the popup's manual cleanup box is processed the same way, locally.
- The text is never sent anywhere by the extension, never logged and never stored.

## What is stored

- A single setting: whether automatic cleaning is switched on or off. It is saved with
  the browser's `chrome.storage.sync` API. If you have browser sync turned on, your
  browser may sync this setting between your own devices.

## Network access

- The extension makes no network requests of its own and contains no analytics,
  tracking or advertising code.

## Permissions

- `storage`: remember the on/off setting.
- Access to Google Translate, DeepL, Bing Translator, Baidu Translate and Youdao
  Translate pages: needed to clean text when you paste it on these sites. The extension
  does not read or change anything else on these pages.

## Contact

Questions or concerns: please open an issue at
https://github.com/Pumpkin02/clean-paste-for-translate/issues
