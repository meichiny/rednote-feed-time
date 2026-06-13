# RedNote Feed Time

显示小红书信息流中笔记的发布时间。

## 背景

小红书 feed 不显示帖子发布时间，时效性帖子无法直观分辨。每条笔记的 ID 前 8 位十六进制字符编码了 Unix 时间戳，本工具将其解码后显示在笔记卡片上。

## 原理

```
笔记 ID: 6a28ef550000000021015e82
         └──前8位 hex──┘
             1781067605 (Unix 秒)
                  ↓
         2026-06-10 13:00 (北京时间)
```

脚本拦截 `rec.xiaohongshu.com/api/sns/v{version}/homefeed` 的 API 响应，遍历每条笔记，从 `id` 解码时间，在 `display_title` 前追加 `(MM-DD HH:mm) `（今年）或 `(YYYY-MM-DD) `（往年）前缀。

## 安装

### Quantumult X

在 `[rewrite_remote]` 添加：
```
https://raw.githubusercontent.com/meichiny/rednote-feed-time/rewrite-rule/modules/quantumultx/rednote-feed-time.conf, tag=小红书Feed时间, update-interval=86400, opt-parser=false, enabled=true
```

开启 MITM，`[general]` 中添加 `udp_drop_list=443`。

### Shadowrocket

导入模块：
```
https://raw.githubusercontent.com/meichiny/rednote-feed-time/rewrite-rule/modules/shadowrocket/rednote-feed-time.sgmodule
```

主配置 `[Rule]` 区域顶部添加 QUIC 阻断规则：
```
AND,((PROTOCOL,UDP),(DST-PORT,443),(DOMAIN-SUFFIX,xiaohongshu.com)),REJECT
```

开启 MITM。

## 文件

```
modules/
├── quantumultx/
│   └── rednote-feed-time.conf   ← QX 远程订阅
├── shadowrocket/
│   └── rednote-feed-time.sgmodule ← Shadowrocket 模块
├── rednote-feed-time.js          ← 主脚本（两平台共用）
docs/
└── research-findings.md          ← 研究文档
```

## 许可证

MIT
