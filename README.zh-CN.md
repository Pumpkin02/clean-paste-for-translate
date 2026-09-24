# 翻译干净粘贴（Clean Paste for Translate）

> 把 PDF 里复制的文字粘贴到谷歌翻译、DeepL 等翻译网站时，自动得到完整段落，而不是一行一行的碎片。

[English](README.md)

一个 Chrome / Edge 小扩展。从 PDF 复制文字时，**每一行末尾都会带一个硬换行**，
粘贴到谷歌翻译、DeepL 之类的翻译网站后，每一行都会被当成单独的一段，句子被从中间切断。

这个扩展会在翻译网站上拦截粘贴，先把断行接回完整段落，再交给翻译器。
真正的段落、标题和列表项会保留下来。

## 功能

- 在谷歌翻译、DeepL、百度翻译、有道翻译、必应翻译里**自动生效**，直接 <kbd>Ctrl</kbd>+<kbd>V</kbd> 即可。
- **保留真正的段落**：即使 PDF 里段落之间没有空行，也能识别段落末行和标题。
- **智能处理连字符**：`frag-`/`ments` → `fragments`，但 `E-`/`Mail` → `E-Mail`，
  `COVID-`/`19` → `COVID-19`，`Ein-`/`und Ausgang` → `Ein- und Ausgang`。
- **中日文接行不加空格**，英文、德文接行加一个空格。
- <kbd>Ctrl</kbd>+<kbd>Z</kbd> 撤销；<kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>V</kbd> 原样粘贴、不处理。
- 点工具栏图标可以开关自动处理，也可以在“手动清理”框里处理任意文字。
- 不联网、不统计，只需要 `storage` 一个权限（用来记住开关状态）。
- 界面支持中文、英文、德文，跟随浏览器语言。

## 安装

1. 下载本仓库（**Code → Download ZIP**）并解压，或者 `git clone`。
2. 打开 `chrome://extensions`（Edge 是 `edge://extensions`）。
3. 打开“开发者模式”。
4. 点“加载已解压的扩展程序”，选择仓库里的 `extension` 文件夹。

## 原理

核心逻辑在 [`extension/src/clean.js`](extension/src/clean.js)：

1. **判断分段**：排版只会在下一个词放不下时自动换行。所以如果下一行的第一个词本来放得进上一行，
   这个换行就是作者手动加的（段落末行、标题等）。空行、缩进行和列表符号也会开始新段落。
2. **接行**：同一段里的行用空格连接，中日文之间不加空格。
3. **连字符**：行末是连字符时，判断是排版断词（去掉）、词本身带的（保留），
   还是省略式写法（保留并加空格）。拿不准时参考粘贴文本里别处的写法。

## 开发

```bash
npm test          # 运行单元测试（Node 18+，无依赖）
npm run package   # 打包成 clean-paste-for-translate.zip，可上传到 Chrome 应用商店
```

## 许可证

[MIT](LICENSE)
