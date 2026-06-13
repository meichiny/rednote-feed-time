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

## 许可证

MIT
