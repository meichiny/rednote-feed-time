# RedNote Feed Time

显示小红书信息流中笔记的发布时间。

## 背景

小红书 feed 不显示帖子发布时间，时效性帖子无法直观分辨。每条笔记的 ID 前 8 位十六进制字符编码了 Unix 时间戳，本工具将其解码后显示在笔记卡片上。

## iOS 代理模块

### Quantumult X

**安装**：在 `[rewrite_remote]` 添加：
```
https://raw.githubusercontent.com/meichiny/rednote-feed-time/shadowrocket-module/modules/quantumultx/rednote-feed-time.conf, tag=小红书Feed时间, update-interval=86400, opt-parser=false, enabled=true
```

**依赖**：
- 开启 MITM，安装并信任证书
- MITM 主机名中添加 `rec.xiaohongshu.com`、`edith.xiaohongshu.com`、`www.xiaohongshu.com`
- `[general]` 中添加 `udp_drop_list=443`（阻断 QUIC，仅冷启动慢 ~8s）

### Shadowrocket

**安装模块**：导入以下 URL
```
https://raw.githubusercontent.com/meichiny/rednote-feed-time/shadowrocket-module/modules/shadowrocket/rednote-feed-time.sgmodule
```

**额外配置**：模块的 QUIC 阻断规则可能无法可靠生效，需在主配置中手动添加：
1. 配置 → 长按当前配置 → 编辑纯文本
2. 找到 `[Rule]` 区域，在顶部添加：
```
AND,((PROTOCOL,UDP),(DST-PORT,443),(DOMAIN-SUFFIX,xiaohongshu.com)),REJECT
```
3. 保存

**依赖**：
- 开启 MITM，安装并信任证书

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

## 原理

每条笔记的 ID 前 8 位十六进制字符编码了 Unix 时间戳（秒级），解码后显示为 `(MM-DD HH:mm)`（今年）或 `(YYYY-MM-DD)`（往年）前缀。

## 许可证

MIT
