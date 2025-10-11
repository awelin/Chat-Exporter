chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "exportChat") {
    const chatData = extractChat();
    const html = buildHTML(chatData);
    downloadHTML(html, chatData.title);
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

function downloadHTML(html, title) {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  chrome.runtime.sendMessage({ action: "saveFile", url, filename: `${title}.html` });
}
