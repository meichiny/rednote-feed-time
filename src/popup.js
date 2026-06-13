(function () {
  const controls = document.getElementById('controls');
  const notRednote = document.getElementById('not-rednote');

  chrome.storage.local.get(['timeRange'], (result) => {
    if (result.timeRange) {
      const el = document.querySelector(`[name="range"][value="${result.timeRange}"]`);
      if (el) el.checked = true;
    }
  });

  function sendSettings() {
    const timeRange = document.querySelector('[name="range"]:checked')?.value || 'all';

    chrome.storage.local.set({ timeRange });

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab) return;
      chrome.tabs.sendMessage(tab.id, { timeRange }).catch(() => {
        controls.style.display = 'none';
        notRednote.style.display = 'block';
      });
    });
  }

  document.querySelectorAll('[name="range"]').forEach((el) => {
    el.addEventListener('change', sendSettings);
  });
})();
