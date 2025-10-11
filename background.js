chrome.commands.onCommand.addListener((command) => {
  if (command === "export-chat") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "exportChat", type: "markdown" });
    });
  } else if (command === "export-chat-html") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "exportChat", type: "html" });
    });
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "saveFile") {
    chrome.downloads.download({
      url: msg.url,
      filename: msg.filename,
      saveAs: false
    });
  }
});
