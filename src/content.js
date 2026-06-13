(function () {
  const { pathname, search } = window.location;
  if (!pathname.startsWith('/explore') && !pathname.startsWith('/user/profile/')) return;
  if (pathname.includes('search') || search.includes('keyword')) return;

  const NOTE_ID_REGEX = /\/explore\/([a-f0-9]{24})/;

  function decodeTimestamp(noteId) {
    const hex = noteId.slice(0, 8);
    return new Date(parseInt(hex, 16) * 1000);
  }

  function formatDateTime(d) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  let timeRange = 'all';
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

  function getCutoff() {
    const now = Date.now();
    switch (timeRange) {
      case '7d': return now - 7 * 86400000;
      case '30d': return now - 30 * 86400000;
      case '365d': return now - 365 * 86400000;
      default: return 0;
    }
  }

  function applyFilter() {
    const cutoff = getCutoff();
    const seen = new Set();
    document.querySelectorAll('a[href^="/explore/"]').forEach((link) => {
      let card = link.parentElement;
      while (card && card !== document.body) {
        if (card.querySelector('a[href^="/explore/"]') && card.querySelector('a[href*="/user/profile/"]')) {
          break;
        }
        card = card.parentElement;
      }
      if (!card || card === document.body || seen.has(card)) return;
      seen.add(card);

      const time = getCardTimestamp(card);
      if (time !== null && time < cutoff) {
        card.style.display = 'none';
        hiddenCards.add(card);
      } else if (hiddenCards.has(card)) {
        card.style.display = '';
        hiddenCards.delete(card);
      }
    });
  }

  let scanTimer;

  function scan() {
    const pn = window.location.pathname;
    if (!pn.startsWith('/explore') && !pn.startsWith('/user/profile/')) return;
    if (pn.includes('search') || window.location.search.includes('keyword')) return;
    document.querySelectorAll('a[href^="/explore/"]').forEach(injectTime);
    if (timeRange !== 'all') {
      applyFilter();
    }
  }

  function handleMessage(msg) {
    if (['all', '7d', '30d', '365d'].includes(msg.timeRange)) timeRange = msg.timeRange;
    applyFilter();
  }

  scan();

  chrome.runtime.onMessage.addListener(handleMessage);

  chrome.storage.local.get(['timeRange'], (result) => {
    if (result.timeRange && result.timeRange !== 'all') timeRange = result.timeRange;
    if (timeRange !== 'all') {
      applyFilter();
    }
  });

  const observer = new MutationObserver(() => {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
