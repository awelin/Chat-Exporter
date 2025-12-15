function sendMessage(action) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, { action: action })
        .catch((err) => console.error('Popup error:', err));
    } else {
      console.warn('Popup: No active tab found');
    }
  });
}

document.getElementById('export-md').addEventListener('click', () => {
  sendMessage("exportMarkdown");
});

document.getElementById('export-html').addEventListener('click', () => {
  sendMessage("exportHTML");
});
