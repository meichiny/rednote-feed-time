(function () {
  const { pathname, search } = window.location;
  if (!pathname.startsWith('/explore') && !pathname.startsWith('/user/profile/')) return;
  if (pathname.includes('search') || search.includes('keyword')) return;
  console.log('[RFT] content script loaded, pathname:', pathname);

  const NOTE_ID_REGEX = /\/explore\/([a-f0-9]{24})/;

  function decodeTimestamp(noteId) {
    const hex = noteId.slice(0, 8);
    return new Date(parseInt(hex, 16) * 1000);
  }

  function formatDateTime(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  let state = { sortOrder: 'none', timeRange: 'all' };
  let hiddenCards = new WeakSet();

  function isProfilePage() {
    return window.location.pathname.startsWith('/user/profile/');
  }

  function injectTime(noteLink) {
    const m = noteLink.getAttribute('href').match(NOTE_ID_REGEX);
    if (!m) return;

    let card = noteLink.parentElement;
    while (card && card !== document.body) {
      if (card.querySelector('a[href^="/explore/"]') && card.querySelector('a[href*="/user/profile/"]')) {
        break;
      }
      card = card.parentElement;
    }
    if (!card || card === document.body) return;

    if (card.querySelector('.xhs-note-time')) return;
    if (!card.querySelector('img')) return;

    const formatted = formatDateTime(decodeTimestamp(m[1]));
    const timeDiv = document.createElement('div');
    timeDiv.className = 'xhs-note-time';
    timeDiv.textContent = formatted;
    Object.assign(timeDiv.style, {
      fontSize: '12px',
      color: '#a0a0a0',
      padding: '1px 0',
    });

    if (isProfilePage()) {
      const footer = card.querySelector('.footer');
      if (footer) {
        requestAnimationFrame(() => {
          if (!footer.querySelector('.xhs-note-time')) {
            footer.appendChild(timeDiv);
          }
        });
        return;
      }
    }

    const userLink = card.querySelector('a[href*="/user/profile/"]');
    if (!userLink) return;
    userLink.parentElement.insertAdjacentElement('afterend', timeDiv);
  }

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

    if (cards.length < 2) return cards;

    // Walk up until cards share a parent with 2+ card siblings
    let result = cards;
    for (let i = 0; i < 3; i++) {
      const parent = result[0].parentElement;
      if (!parent || parent === document.body) break;
      const siblings = Array.from(parent.children).filter(
        (child) => child.querySelector('a[href^="/explore/"]')
      );
      if (siblings.length >= 2) break;
      result = result.map((c) => c.parentElement).filter(Boolean);
      result = [...new Set(result)];
      if (result.length < 2) break;
    }
    // Deduplicate: only keep outermost ancestors (filter out nested elements)
    return result.filter((card, _, all) => !all.some((other) => other !== card && other.contains(card)));
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
      const entries = groupCards.map((card) => ({ card, time: getCardTimestamp(card) }));
      const times = entries.map((e) => e.time ? new Date(e.time).toISOString() : null);
      console.log('[RFT] applySort DOM-order times (first 3 / last 3):',
        times.slice(0, 3), '...', times.slice(-3));

      const sorted = entries
        .filter((item) => item.time !== null)
        .sort((a, b) => (state.sortOrder === 'asc' ? a.time - b.time : b.time - a.time));
      const sortedTimes = sorted.map((e) => new Date(e.time).toISOString());
      console.log('[RFT] applySort sorted times (first 3 / last 3):',
        sortedTimes.slice(0, 3), '...', sortedTimes.slice(-3));

      const validCards = groupCards.filter((c) => getCardTimestamp(c) !== null);
      const firstDiff = sorted.findIndex((item, i) => item.card !== validCards[i]);
      console.log('[RFT] applySort firstDiff index:', firstDiff, 'of', sorted.length);
      if (firstDiff === -1) {
        console.log('[RFT] applySort DOM already matches sort order, skipping');
        return;
      }

      console.log('[RFT] applySort moving', sorted.length, 'cards...');
      sorted.forEach((item) => item.card.parentElement.appendChild(item.card));
      console.log('[RFT] applySort DONE');
    });
  }

  function applyFilter(cards) {
    const cutoff = getCutoff();
    cards.forEach((card) => {
      const time = getCardTimestamp(card);
      if (time !== null && time < cutoff) {
        card.style.display = 'none';
        hiddenCards.add(card);
        return;
      }
      if (hiddenCards.has(card)) {
        card.style.display = '';
        hiddenCards.delete(card);
      }
    });
  }

  function reapply() {
    const cards = findAllCards();
    console.log('[RFT] reapply: found', cards.length, 'cards at levels',
      cards.map((c) => c.tagName + (c.className ? '.' + c.className.split(' ')[0] : '')));
    if (!cards.length) return;
    applySort(cards);
    applyFilter(cards);
  }

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
    console.log('[RFT] handleMessage received:', JSON.stringify(msg));
    if (['none', 'asc', 'desc'].includes(msg.sortOrder)) state.sortOrder = msg.sortOrder;
    if (['all', '7d', '30d', '365d'].includes(msg.timeRange)) state.timeRange = msg.timeRange;
    console.log('[RFT] handleMessage state now:', JSON.stringify(state));
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
})();
