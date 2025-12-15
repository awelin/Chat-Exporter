chrome.runtime.onInstalled.addListener(() => {
  console.log('Chat Printer Extension Installed/Updated');
});

chrome.commands.onCommand.addListener((command) => {
  console.log('Command received:', command);

  let action = "";
  if (command === "export-markdown") {
    action = "exportMarkdown";
  } else if (command === "export-html") {
    action = "exportHTML";
  }

  if (action) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const tab = tabs[0];
        console.log(`Found active tab: ID=${tab.id}, URL=${tab.url}, Status=${tab.status}`);

        console.log(`Sending ${action} message to tab:`, tab.id);
        chrome.tabs.sendMessage(tab.id, { action: action })
          .then(() => console.log('Message sent successfully'))
          .catch((err) => {
            console.error('Error sending message:', err);
            // Common error: "Could not establish connection" -> Script not injected
            if (err.message.includes("Could not establish connection")) {
              console.error("The content script is not running. The user needs to refresh the page.");
            }
          });
      } else {
        console.warn('No active tab found. Make sure the ChatGPT tab is focused.');
      }
    });
  }
});
