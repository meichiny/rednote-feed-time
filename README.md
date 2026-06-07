# RedNote Feed Time

显示小红书（RedNote）信息流中笔记的发布时间。

Shows the generation time of notes on Xiaohongshu (RedNote) feeds.

---

## 工作原理 / How it works

每条笔记的 ID 前 8 位十六进制字符编码了 Unix 时间戳（秒级），将其解码为 `yyyy-MM-dd HH:mm` 格式显示在笔记卡片上。

The first 8 hex characters of each note ID encode a Unix timestamp (seconds). The extension decodes it to `yyyy-MM-dd HH:mm` format and displays it on each note card.

## 安装 / Installation

1. 打开 `chrome://extensions`
2. 开启「开发者模式」（右上角）
3. 点击「加载已解压的扩展程序」
4. 选择本项目文件夹

1. Open `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select this project folder

## 支持页面 / Supported Pages

- `xiaohongshu.com/explore` — 首页推荐 / Home feed
- `xiaohongshu.com/user/profile/*` — 用户主页 / User profile

## 许可证 / License

MIT
