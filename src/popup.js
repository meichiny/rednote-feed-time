(function () {
  const controls = document.getElementById('controls');
  const notRednote = document.getElementById('not-rednote');
  let restored = false;

  chrome.storage.local.get(['sortOrder', 'timeRange'], (result) => {
    if (restored) return;
    if (result.sortOrder) {
      const el = document.querySelector(`[name="sort"][value="${result.sortOrder}"]`);
      if (el) el.checked = true;
    }
    if (result.timeRange) {
      const el = document.querySelector(`[name="range"][value="${result.timeRange}"]`);
      if (el) el.checked = true;
    }
    restored = true;
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
    el.addEventListener('change', () => {
      restored = true;
      sendSettings();
    });
  });
})();
