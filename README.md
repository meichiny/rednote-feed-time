# RedNote Feed Time

显示小红书（RedNote）信息流中笔记的发布时间。

## 工作原理

每条笔记的 ID 前 8 位十六进制字符编码了 Unix 时间戳（秒级），将其解码为 `yyyy-MM-dd HH:mm` 格式显示在笔记卡片上。

## 安装

### 从 GitHub Release 安装

1. 前往 [Releases](https://github.com/meichiny/rednote-feed-time/releases) 页面，下载最新版本的 `rednote-feed-time-v*.zip`
2. 解压到本地文件夹
3. 打开 `chrome://extensions`
4. 开启「开发者模式」（右上角）
5. 点击「加载已解压的扩展程序」
6. 选择解压后的文件夹

## 支持页面

- `xiaohongshu.com/explore` — 首页推荐
- `xiaohongshu.com/user/profile/*` — 用户主页

## 许可证

MIT

---

# RedNote Feed Time

Shows the generation time of notes on Xiaohongshu (RedNote) feeds.

## How it works

The first 8 hex characters of each note ID encode a Unix timestamp (seconds). The extension decodes it to `yyyy-MM-dd HH:mm` format and displays it on each note card.

## Installation

### Install from GitHub Release

1. Go to the [Releases](https://github.com/meichiny/rednote-feed-time/releases) page and download the latest `rednote-feed-time-v*.zip`
2. Unzip to a local folder
3. Open `chrome://extensions`
4. Enable "Developer mode" (top right)
5. Click "Load unpacked"
6. Select the unzipped folder

## Supported Pages

- `xiaohongshu.com/explore` — Home feed
- `xiaohongshu.com/user/profile/*` — User profile

## License

MIT
