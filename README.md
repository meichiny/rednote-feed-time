# RedNote Feed Time

显示小红书（RedNote）信息流中笔记的发布时间。

## 背景

小红书 feed 信息流中不显示帖子的发布时间，具有时效性的帖子无法直观分辨是否已过时。帖子的标题和封面图往往只为吸引眼球，无法从中得知发布时间。本插件让你在浏览 feed 时，无需点开帖子详情即可看到帖子生成时间，方便快速决定是否点开阅读。

![效果示例](feed-time-example.png)

## 工作原理

每条笔记的 ID 前 8 位十六进制字符编码了 Unix 时间戳（秒级），将其解码为 `yyyy-MM-dd HH:mm` 格式显示在笔记卡片上。

## 排序与筛选

点击浏览器工具栏中的扩展图标打开弹出面板，可以：

- **排序方式**：按笔记生成时间升序（旧→新）或降序（新→旧）排列信息流
- **时间筛选**：只显示一周内、一个月内或一年内发布的笔记

设置会自动保存，刷新页面或重新打开浏览器后依然有效。

## 安装

### 构建

```bash
npm install
npm run build          # 构建 Chrome + Firefox 两版
npm run build:chrome   # 仅 Chrome
npm run build:firefox  # 仅 Firefox
```

构建产物位于 `dist/` 目录。

### Chrome

1. 前往 [Releases](https://github.com/meichiny/rednote-feed-time/releases) 页面，下载最新版本的 `rednote-feed-time-chrome-v*.zip`
2. 解压到本地文件夹
3. 打开 `chrome://extensions`
4. 开启「开发者模式」（右上角）
5. 点击「加载已解压的扩展程序」
6. 选择解压后的文件夹

或直接加载 `dist/chrome/`（本地构建后）。

### Firefox（本地开发）

1. 构建扩展：`npm install && npm run build:firefox`
2. 打开 `about:debugging#/runtime/this-firefox`
3. 点击「加载临时附加组件」
4. 选择 `dist/firefox/manifest.json`

### Firefox（AMO 发布）

前往 [addons.mozilla.org](https://addons.mozilla.org) 提交 `dist/packages/rednote-feed-time-firefox-v*.xpi`

## 支持页面

- `xiaohongshu.com/explore` — 首页推荐
- `xiaohongshu.com/user/profile/*` — 用户主页
- Firefox Android 同样支持

## 许可证

MIT

---

# RedNote Feed Time

Shows the generation time of notes on Xiaohongshu (RedNote) feeds.

## Background

The RedNote feed does not display the publish time of each post, making it impossible to tell at a glance whether a time-sensitive post is outdated. Titles and cover images are often designed for click-through, not to indicate when the post was created. This extension lets you see the generation time of each note while browsing the feed, without opening the post, helping you decide quickly whether to read it.

## How it works

![Screenshot](feed-time-example.png)

The first 8 hex characters of each note ID encode a Unix timestamp (seconds). The extension decodes it to `yyyy-MM-dd HH:mm` format and displays it on each note card.

## Sort & Filter

Click the extension icon in the browser toolbar to open the popup panel:

- **Sort**: Arrange feed notes by generation time, ascending (old→new) or descending (new→old)
- **Filter**: Show only notes from the last week, month, or year

Settings are automatically saved and persist across page reloads.

## Installation

### Build from source

```bash
npm install
npm run build          # build both Chrome & Firefox versions
npm run build:chrome   # Chrome only
npm run build:firefox  # Firefox only
```

Output goes to `dist/`.

### Chrome

1. Go to the [Releases](https://github.com/meichiny/rednote-feed-time/releases) page and download the latest `rednote-feed-time-chrome-v*.zip`
2. Unzip to a local folder
3. Open `chrome://extensions`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked"
6. Select the unzipped folder

Or load `dist/chrome/` directly (after local build).

### Firefox (development)

1. Build the extension: `npm install && npm run build:firefox`
2. Open `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select `dist/firefox/manifest.json`

### Firefox (AMO release)

Submit `dist/packages/rednote-feed-time-firefox-v*.xpi` to [addons.mozilla.org](https://addons.mozilla.org)

## Supported Pages

- `xiaohongshu.com/explore` — Home feed
- `xiaohongshu.com/user/profile/*` — User profile
- Firefox Android is also supported

## License

MIT
