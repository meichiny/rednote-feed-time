# 开发记录

## 项目概述

RedNote Feed Time — 一个 Chrome 浏览器扩展，通过解码小红书（RedNote）笔记 ID 前 8 位十六进制字符中的 Unix 时间戳，在 feed 信息流中显示笔记的生成时间。

## 技术架构

- **类型**: Chrome Extension (Manifest V3)
- **文件**: `content.js`（内容脚本）、`manifest.json`（配置）、`icon.png`（图标）
- **运行方式**: 在匹配页面自动注入，纯客户端 DOM 操作，无需网络请求

## 核心原理

笔记 ID 格式为 24 位十六进制字符串，如 `6a24f4900000000006020b68`：
- 前 8 位 (`6a24f490`) = Unix 时间戳（秒），编码为十六进制
- `parseInt("6a24f490", 16) * 1000` → `new Date()` → `yyyy-MM-dd HH:mm`

## 开发历程

### 1. 初始实现

- 通过 `__INITIAL_STATE__` 查找时间字段 → 发现没有
- 改为 `a[href*="/user/profile/"]` 遍历，找到卡片容器后注入时间
- 位置：作者名称旁（行内）

### 2. 位置调整

- **问题**: 用户要求改为「帖子作者名称下方，纵向左对齐」
- **解决**: 改为在用户链接后插入 block div，左对齐

### 3. 显示位置改为卡片底部

- **问题**: 与垂直相邻的帖子区域重叠
- **解决**: 调整 `padding` 和 `line-height`

### 4. 位置改为卡片下方右对齐

- **问题**: 用户要求改为「整个卡片下方，右对齐」
- **解决**: `card.insertAdjacentElement('afterend', timeDiv)` + `textAlign: right`

### 5. 回到作者名称下方

- **问题**: 用户觉得右对齐不合适，改回作者名称下方左对齐
- **解决**: `userLink.insertAdjacentElement('afterend', timeDiv)`，移除右对齐

### 6. Flex 容器内换行问题

- **问题**: 时间与作者名在同一行（flex 容器），遮挡了作者名
- **解决**: 改为在 flex 容器的父级之后插入（`userLink.parentElement.insertAdjacentElement('afterend', timeDiv)`）

### 7. 侧边栏「我」和 profile 页面重复显示

- **问题**: 侧边栏头像旁显示 2 个时间；个人主页每篇帖子显示 3 个
- **原因**: 从 `user/profile` 链接遍历，会匹配侧边栏和多个用户链接
- **解决**: 改为从 `a[href^="/explore/"]`（笔记链接）遍历，用 `Set` 按 note ID 去重，增加 `img` 元素检查排除侧边栏

### 8. Profile 页面支持

- **问题**: 需要 profile 页面的 feed 也显示时间
- **解决**: manifest 增加匹配 `/user/profile/*`；profile 页面插入到 `class="footer"` 内

### 9. 虚拟滚动导致时间消失

- **问题**: 滚动到底部再返回顶部，时间消失
- **原因**: Vue 虚拟滚动销毁并重建 DOM，`Set` 去重阻止了重新注入
- **解决**: 移除 `Set` 去重，改为检查卡片是否已包含 `.xhs-note-time` 元素（DOM 存在性检查）

### 10. Profile 页面卡死（严重 Bug）

- **现象**: 点击侧边栏「我」进入 profile 页面，页面一直转圈，开发者工具也调不出
- **原因**: `footer.appendChild(timeDiv)` 插入到 Vue 控制的元素内，触发 Vue 重渲染 → 删除时间元素 → MutationObserver 检测到变化 → 重新注入 → 无限循环
- **解决**: 
  1. `requestAnimationFrame` 延迟注入，避开 Vue 渲染周期
  2. MutationObserver 回调改为 300ms 防抖（`setTimeout`），避免渲染期间频繁扫描

### 11. 搜索结果页面不应显示

- **问题**: 搜索结果页的 feed 已自带时间（xx天前/MM-dd）
- **解决**: 检查 `pathname.includes('search')` 和 `search.includes('keyword')` 跳过

### 12. 时间格式

- 最终格式: `yyyy-MM-dd HH:mm`（24 小时制）
- 显示文字：仅绝对时间，无"generation time"前缀，无相对时间

## 常见问题 FAQ

**Q: 时间是如何获取的？**
A: 从笔记 ID 前 8 位十六进制字符解码为 Unix 时间戳。不是 API 返回的发布时间，而是 ID 生成时间，实践中与发布时间非常接近。

**Q: 为什么有的帖子没有显示时间？**
A: 检查: (1) 是否在支持的页面（explore / user/profile）；(2) 卡片是否包含封面图 `img` 元素；(3) 是否为搜索结果页。

**Q: 扩展需要什么权限？**
A: 仅 `host_permissions` 访问 `xiaohongshu.com` 的两个路径，无需其他权限。不收集任何用户数据，不发送网络请求。

## 发布

- GitHub: https://github.com/meichiny/rednote-feed-time
- 安装方式: 下载 Release zip → 解压 → chrome://extensions → 开发者模式 → 加载已解压的扩展程序
