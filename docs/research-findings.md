# 小红书 iOS Feed API 研究记录

## 概述

研究小红书 iOS App 首页 feed 的 API 响应结构，为代理模块实现笔记时间显示功能提供依据。

## 验证的笔记链接

用户从 iOS App 分享的笔记短链接：

```
http://xhslink.com/o/Avj9vK8lGEr
```

重定向后：

```
https://www.xiaohongshu.com/discovery/item/6a28ef550000000021015e82?app_platform=ios&app_version=9.33.3&...
```

### 笔记 ID 格式验证

| 项目 | 值 |
|------|-----|
| 笔记 ID | `6a28ef550000000021015e82` |
| 长度 | 24 位十六进制字符 |
| Hex 前 8 位 | `6a28ef55` |
| 解码 Unix 时间戳 | `1781067605` 秒 |
| 解码时间 | `2026-06-10 13:00` |

结论：iOS 端笔记 ID 格式与网页版完全一致。

## Feed API 分析

### 目标端点

```
rec.xiaohongshu.com/api/sns/v6/homefeed
```

### 响应结构

```json
{
  "success": true,
  "data": [
    {
      "id": "6a1932f6000000000803d599",
      "model_type": "note",
      "type": "normal",
      "title": "...",
      "display_title": "...",
      "desc": "",
      "timestamp": 1780036342,
      "user": { ... },
      "images_list": [ ... ],
      "likes": 2052,
      ...
    }
  ]
}
```

### 关键字段

| 字段 | 路径 | 说明 |
|------|------|------|
| `id` | `obj.data[].id` | 笔记 ID，24 位 hex，前 8 位编码创建时间 |
| `model_type` | `obj.data[].model_type` | `"note"` 为普通笔记 |
| `display_title` | `obj.data[].display_title` | 显示标题 |
| `title` | `obj.data[].title` | 标题 |
| `name` | `obj.data[].name` | 名称（与 title 相同） |
| `timestamp` | `obj.data[].timestamp` | API 时间戳（有 1/7 偏差，不可靠） |

### 数据结构

```
obj.data → Array
  .model_type === "note"  → 笔记卡片
  .id          → 前 8 位 hex = Unix timestamp
  .display_title → 显示的标题
  .title         → 标题
  .name          → 名称
```

## Proxy 方案

### 实现原理

1. MITM 解密 `rec.xiaohongshu.com/homefeed` 的 HTTPS 响应
2. 用 JS 脚本处理 JSON 响应体
3. 从 `id` 前 8 位 hex 解码创建时间
4. 在 `display_title`/`title`/`name` 前追加时间前缀
5. 防重复追加（通过正则检查）

### QUIC 处理

小米书 App 使用 QUIC/HTTP3 连接 CDN，绕过 MITM。需阻断 UDP 443 端口到 xiaohongshu.com 的流量，强制降级 HTTPS。

- Quantumult X: `[general] udp_drop_list=443`（全局）
- Shadowrocket: `[Rule] AND,((PROTOCOL,UDP),(DST-PORT,443),(DOMAIN-SUFFIX,xiaohongshu.com)),REJECT`

### 状态

| Platform | Status |
|----------|--------|
| Quantumult X | ✅ 已验证通过 |
| Shadowrocket | ❌ 模块格式问题待排查 |
| Chrome 扩展 | ✅ 已有独立实现 |
