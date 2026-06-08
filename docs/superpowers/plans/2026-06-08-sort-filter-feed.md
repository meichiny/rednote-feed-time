# Sort & Filter Feed Notes Implementation Plan

> **For agentic workers:** Use subagent-driven-development or executing-plans to implement this task-by-task.

**Goal:** Add popup-based sort (asc/desc by generation time) and time-range filter (all/week/month/year) to the extension.

**Architecture:** Popup communicates with content script via `chrome.tabs.sendMessage`. Content script manages sort/filter state, reorders DOM cards, and toggles visibility. Settings persisted in `chrome.storage.local`.

**Tech Stack:** Vanilla JS, Chrome/Firefox MV3, `chrome.storage.local`

---

### Task 1: Version bump & update both manifests

**Files:**
- Modify: `package.json:3`
- Modify: `src/manifest.chrome.json`
- Modify: `src/manifest.firefox.json`

- [ ] Bump version to `1.2.0` in `package.json`
- [ ] Bump version and add `action` + `storage` permission in `src/manifest.chrome.json`

  Change from:
  ```json
  {
    "version": "1.1.0",
    ...
    "content_scripts": [...],
    "icons": {...}
  }
  ```
  To:
  ```json
  {
    "version": "1.2.0",
    ...
    "action": {
      "default_popup": "popup.html",
      "default_title": "RedNote Feed Time"
    },
    "permissions": ["storage"],
    "content_scripts": [...],
    "icons": {...}
  }
  ```

- [ ] Apply identical changes to `src/manifest.firefox.json`

- [ ] Commit: `git add package.json src/manifest.chrome.json src/manifest.firefox.json && git commit -m "chore: bump to v1.2.0, add popup action and storage permission"`

---

### Task 2: Create popup.html

**Files:**
- Create: `src/popup.html`

- [ ] Write `src/popup.html`:
  ```html
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>RedNote Feed Time</title>
    <style>
      body {
        width: 220px;
        margin: 0;
        padding: 14px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        font-size: 13px;
        color: #222;
      }
      .section { margin-bottom: 12px; }
      .section:last-child { margin-bottom: 0; }
      .section-title {
        font-weight: 600;
        font-size: 12px;
        color: #666;
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      label {
        display: block;
        padding: 4px 0;
        cursor: pointer;
      }
      label:hover { color: #000; }
      input[type="radio"] { margin-right: 6px; }
      #not-rednote {
        display: none;
        text-align: center;
        color: #999;
        padding: 30px 0;
        font-size: 13px;
      }
    </style>
  </head>
  <body>
    <div id="not-rednote">请在 RedNote 页面使用此功能</div>
    <div id="controls">
      <div class="section">
        <div class="section-title">排序方式</div>
        <label><input type="radio" name="sort" value="none" checked> 不排序</label>
        <label><input type="radio" name="sort" value="asc"> 按时间升序（旧→新）</label>
        <label><input type="radio" name="sort" value="desc"> 按时间降序（新→旧）</label>
      </div>
      <div class="section">
        <div class="section-title">时间筛选</div>
        <label><input type="radio" name="range" value="all" checked> 全部</label>
        <label><input type="radio" name="range" value="7d"> 一周内</label>
        <label><input type="radio" name="range" value="30d"> 一个月内</label>
        <label><input type="radio" name="range" value="365d"> 一年内</label>
      </div>
    </div>
    <script src="popup.js"></script>
  </body>
  </html>
  ```

- [ ] Commit: `git add src/popup.html && git commit -m "feat: add popup HTML for sort/filter controls"`

---

### Task 3: Create popup.js

**Files:**
- Create: `src/popup.js`

- [ ] Write `src/popup.js`:
  ```js
  (function () {
    const controls = document.getElementById('controls');
    const notRednote = document.getElementById('not-rednote');

    chrome.storage.local.get(['sortOrder', 'timeRange'], (result) => {
      if (result.sortOrder) {
        const el = document.querySelector(`[name="sort"][value="${result.sortOrder}"]`);
        if (el) el.checked = true;
      }
      if (result.timeRange) {
        const el = document.querySelector(`[name="range"][value="${result.timeRange}"]`);
        if (el) el.checked = true;
      }
    });

    function sendSettings() {
      const sortOrder = document.querySelector('[name="sort"]:checked')?.value || 'none';
      const timeRange = document.querySelector('[name="range"]:checked')?.value || 'all';

      chrome.storage.local.set({ sortOrder, timeRange });

      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (!tab) return;
        chrome.tabs.sendMessage(tab.id, { sortOrder, timeRange }).catch(() => {
          controls.style.display = 'none';
          notRednote.style.display = 'block';
        });
      });
    }

    document.querySelectorAll('[name="sort"], [name="range"]').forEach((el) => {
      el.addEventListener('change', sendSettings);
    });
  })();
  ```

- [ ] Commit: `git add src/popup.js && git commit -m "feat: add popup JS for messaging and storage"`

---

### Task 4: Modify content.js — add sort/filter state, message listener, helper functions, and replace isProfilePage with function

**Files:**
- Modify: `src/content.js`

- [ ] **Step: Replace `isProfilePage` const with function**

  Change line 18:
  ```js
  const isProfilePage = window.location.pathname.startsWith('/user/profile/');
  ```
  To:
  ```js
  function isProfilePage() {
    return window.location.pathname.startsWith('/user/profile/');
  }
  ```

- [ ] **Step: Add state object after `formatDateTime`**

  Add after line 16 (after `formatDateTime`):
  ```js
  let state = { sortOrder: 'none', timeRange: 'all' };
  let hiddenCards = new WeakSet();
  ```

- [ ] **Step: Add helper functions after `injectTime`**

  Add after line 61 (after closing brace of `injectTime`):
  ```js
  function getCardTimestamp(card) {
    const link = card.querySelector('a[href^="/explore/"]');
    if (!link) return null;
    const m = link.getAttribute('href').match(NOTE_ID_REGEX);
    if (!m) return null;
    return decodeTimestamp(m[1]).getTime();
  }

  function findAllCards() {
    const cards = [];
    const seen = new Set();
    document.querySelectorAll('a[href^="/explore/"]').forEach((link) => {
      let card = link.parentElement;
      while (card && card !== document.body) {
        if (card.querySelector('a[href^="/explore/"]') && card.querySelector('a[href*="/user/profile/"]')) {
          break;
        }
        card = card.parentElement;
      }
      if (card && card !== document.body && !seen.has(card)) {
        seen.add(card);
        cards.push(card);
      }
    });
    return cards;
  }

  function getCutoff() {
    const now = Date.now();
    switch (state.timeRange) {
      case '7d': return now - 7 * 86400000;
      case '30d': return now - 30 * 86400000;
      case '365d': return now - 365 * 86400000;
      default: return 0;
    }
  }

  function applySort(cards) {
    if (state.sortOrder === 'none') return;
    const groups = new Map();
    cards.forEach((card) => {
      const parent = card.parentElement;
      if (!groups.has(parent)) groups.set(parent, []);
      groups.get(parent).push(card);
    });
    groups.forEach((groupCards) => {
      const sorted = groupCards
        .map((card) => ({ card, time: getCardTimestamp(card) }))
        .filter((item) => item.time !== null)
        .sort((a, b) => (state.sortOrder === 'asc' ? a.time - b.time : b.time - a.time));

      const needsReorder = sorted.some((item, i) => item.card !== groupCards[i]);
      if (!needsReorder) return;

      sorted.forEach((item) => item.card.parentElement.appendChild(item.card));
    });
  }

  function applyFilter(cards) {
    const cutoff = getCutoff();
    cards.forEach((card) => {
      const time = getCardTimestamp(card);
      if (time === null) return;
      const shouldHide = time < cutoff;
      if (shouldHide) {
        card.style.display = 'none';
        hiddenCards.add(card);
      } else if (hiddenCards.has(card)) {
        card.style.display = '';
        hiddenCards.delete(card);
      }
    });
  }

  function reapply() {
    const cards = findAllCards();
    if (!cards.length) return;
    applySort(cards);
    applyFilter(cards);
  }
  ```

- [ ] **Step: Update `scan()` and add message listener + storage init**

  Replace current `scan()` function (lines 65-70) and code after it (lines 72-79) with:
  ```js
  let scanTimer;

  function scan() {
    const pn = window.location.pathname;
    if (!pn.startsWith('/explore') && !pn.startsWith('/user/profile/')) return;
    if (pn.includes('search') || window.location.search.includes('keyword')) return;
    document.querySelectorAll('a[href^="/explore/"]').forEach(injectTime);
    if (state.sortOrder !== 'none' || state.timeRange !== 'all') {
      reapply();
    }
  }

  function handleMessage(msg) {
    if (msg.sortOrder !== undefined) state.sortOrder = msg.sortOrder;
    if (msg.timeRange !== undefined) state.timeRange = msg.timeRange;
    reapply();
  }

  scan();

  chrome.runtime.onMessage.addListener(handleMessage);

  chrome.storage.local.get(['sortOrder', 'timeRange'], (result) => {
    if (result.sortOrder && result.sortOrder !== 'none') state.sortOrder = result.sortOrder;
    if (result.timeRange && result.timeRange !== 'all') state.timeRange = result.timeRange;
    if (state.sortOrder !== 'none' || state.timeRange !== 'all') {
      reapply();
    }
  });

  const observer = new MutationObserver(() => {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  ```

- [ ] **Verify the final file** — Change `if (isProfilePage)` on line 46 to `if (isProfilePage())`.

- [ ] Commit: `git add src/content.js && git commit -m "feat: add sort/filter state, message listener, reapply logic to content script"`

---

### Task 5: Update build script to include popup files

**Files:**
- Modify: `scripts/build.mjs`

- [ ] Add popup file copies after `content.js` line in `build()`

  After `await copyFile(path.join(SRC, 'content.js'), path.join(DIST, 'content.js'));`:
  ```js
  await copyFile(path.join(SRC, 'popup.html'), path.join(DIST, 'popup.html'));
  await copyFile(path.join(SRC, 'popup.js'), path.join(DIST, 'popup.js'));
  ```

- [ ] Commit: `git add scripts/build.mjs && git commit -m "chore: add popup files to build script"`

---

### Task 6: Update README with new feature documentation

**Files:**
- Modify: `README.md`

- [ ] Add section after "工作原理" section:

  ```markdown
  ## 排序与筛选

  点击浏览器工具栏中的扩展图标打开弹出面板，可以：

  - **排序方式**：按笔记生成时间升序（旧→新）或降序（新→旧）排列信息流
  - **时间筛选**：只显示一周内、一个月内或一年内发布的笔记

  设置会自动保存，刷新页面或重新打开浏览器后依然有效。
  ```

  Also add English version after the English "How it works" section:
  ```markdown
  ## Sort & Filter

  Click the extension icon in the browser toolbar to open the popup panel:

  - **Sort**: Arrange feed notes by generation time, ascending (old→new) or descending (new→old)
  - **Filter**: Show only notes from the last week, month, or year

  Settings are automatically saved and persist across page reloads.
  ```

- [ ] Commit: `git add README.md && git commit -m "docs: add sort/filter feature documentation"`

---

### Task 7: Build and verify

- [ ] Run `npm run build` to verify no errors
- [ ] Verify `dist/chrome/` contains `popup.html`, `popup.js`, `content.js`, `manifest.json`
- [ ] Verify `dist/firefox/` contains the same
- [ ] Commit: `git add -A && git commit -m "chore: build dist for v1.2.0"`
