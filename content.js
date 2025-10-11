chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "exportChat") {
    const chatData = extractChat();
    if (msg.type === "html") {
      const html = buildHTML(chatData);
      downloadFile(html, chatData.title + ".html", 'text/html');
    } else if (msg.type === "markdown") {
      const markdown = buildMarkdown(chatData);
      downloadFile(markdown, chatData.title + ".md", 'text/markdown');
    }
  }
});

function extractChat() {
  const messages = [...document.querySelectorAll('div[data-message-id]')]; // Updated selector for ChatGPT message containers
  const content = messages.map(el => `<div class="message">${el.outerHTML}</div>`).join('');
  const title = document.title || "ChatGPT Conversation";
  const url = window.location.href;
  const timestamp = new Date().toISOString();
  return { title, content, url, timestamp };
}

function downloadFile(content, filename, mimetype) {
  const blob = new Blob([content], { type: mimetype });
  const url = URL.createObjectURL(blob);
  chrome.runtime.sendMessage({ action: "saveFile", url, filename });
}
