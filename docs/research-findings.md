# 小红书 iOS Feed API 研究记录

## 概述

研究小红书 iOS App（v9.33.3）首页 feed 的 API 响应结构，为 Shadowrocket 模块实现笔记时间显示功能提供依据。

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

结论：iOS 端笔记 ID 格式与网页版完全一致，解码逻辑可复用。

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
      "title": "就是这只猫！差点让我直播被封了😠",
      "display_title": "就是这只猫！差点让我直播被封了😠",
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

### 关键字段发现

| 字段 | 路径 | 说明 |
|------|------|------|
| `id` | `obj.data[].id` | 笔记 ID，24 位 hex |
| `model_type` | `obj.data[].model_type` | `"note"` 为普通笔记 |
| `title` | `obj.data[].title` | 标题（部分笔记为空） |
| `display_title` | `obj.data[].display_title` | 显示标题（优先使用） |
| `desc` | `obj.data[].desc` | 描述（feed 中始终为空） |
| `timestamp` | `obj.data[].timestamp` | 有字段但 App 不显示 |

### `timestamp` 字段分析

对比 7 条笔记的 ID 编码时间和 API timestamp：

| ID 编码时间 | API timestamp | 偏差 |
|-------------|--------------|------|
| 2026-05-29 14:32 | 2026-05-29 14:32 | 0h |
| 2026-06-12 13:35 | 2026-06-12 13:35 | 0h |
| 2026-06-10 14:31 | 2026-06-10 14:31 | 0h |
| 2026-06-10 08:49 | 2026-06-10 08:49 | 0h |
| 2026-06-05 22:18 | 2026-06-05 22:18 | 0h |
| 2026-06-12 13:51 | 2026-06-12 13:51 | 0h |
| 2026-06-10 20:07 | 2026-06-11 17:37 | **21h** |

结论：ID 编码的时间 = 笔记创建时间。API 的 `timestamp` 字段在 6/7 条中匹配，但有 1 条偏差 21 小时，可能表示编辑/更新时间，不可靠复用。

### 数据结构结论

```
obj.data → Array
  .model_type === "note"  → 笔记卡片（跳过广告/直播）
  .id          → 笔记 ID，24 位 hex，前 8 位编码创建时间
  .display_title → 显示的标题（优先写入）
  .title         → 标题（备用写入）
```

## Shadowrocket 模块方案

### 拦截模式

```
type=http-response
pattern=^https:\/\/rec\.xiaohongshu\.com\/api\/sns\/v6\/homefeed
requires-body=true
```

### 处理逻辑

1. 只处理 `model_type === "note"` 的条目
2. 校验 `id` 为 24 位 hex
3. 从 `id` 前 8 位 hex 解码时间
4. 今年内格式 `(MM-DD HH:mm)`，往年 `(YYYY-MM-DD)`
5. 防重复追加（检查后缀正则）
6. 同时写入 `display_title` 和 `title`
7. 异常保护：任何失败单条跳过，不影响其他

### MITM 域名

```
rec.xiaohongshu.com
```
