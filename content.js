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

  const isProfilePage = window.location.pathname.startsWith('/user/profile/');

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

    if (isProfilePage) {
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

  let scanTimer;

  function scan() {
    const pn = window.location.pathname;
    if (!pn.startsWith('/explore') && !pn.startsWith('/user/profile/')) return;
    if (pn.includes('search') || window.location.search.includes('keyword')) return;
    document.querySelectorAll('a[href^="/explore/"]').forEach(injectTime);
  }

  scan();

  const observer = new MutationObserver(() => {
    clearTimeout(scanTimer);
    scanTimer = setTimeout(scan, 300);
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
