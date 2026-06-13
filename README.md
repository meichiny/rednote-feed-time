# RedNote Feed Time

显示小红书信息流中笔记的发布时间。

## 背景

小红书 feed 不显示帖子发布时间，时效性帖子无法直观分辨。每条笔记的 ID 前 8 位十六进制字符编码了 Unix 时间戳，本工具将其解码后显示在笔记卡片上。

## iOS 代理模块

### Quantumult X ✅

**安装**：在 `[rewrite_remote]` 添加：
```
https://raw.githubusercontent.com/meichiny/rednote-feed-time/shadowrocket-module/modules/quantumultx/rednote-feed-time.conf, tag=小红书Feed时间, update-interval=86400, opt-parser=false, enabled=true
```

**依赖**：
- 开启 MI™，安装并信任证书
- `[general]` 中添加 `udp_drop_list=443`（阻断 QUIC，仅冷启动慢 ~8s）

### Shadowrocket 🚧

WIP — 模块格式兼容问题待修复。

## Chrome 扩展

### 安装

1. 前往 [Releases](https://github.com/meichiny/rednote-feed-time/releases) 下载最新 `.zip`
2. 解压 → `chrome://extensions` → 开发者模式 → 加载已解压的扩展程序

### 构建

```bash
npm install
npm run build          # Chrome + Firefox
npm run build:chrome   # Chrome only
npm run build:firefox  # Firefox only
```

### 支持页面

- `xiaohongshu.com/explore` — 首页推荐
- `xiaohongshu.com/user/profile/*` — 用户主页

## 许可证

MIT
