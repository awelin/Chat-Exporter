function buildHTML({ title, content, url, timestamp }) {
  const formattedTimestamp = new Date(timestamp).toLocaleString();
  return `
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="source-url" content="${url}" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 2em; }
      .message { margin-bottom: 1em; }
      .metadata { margin-bottom: 2em; font-size: 0.9em; color: #666; }
      code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: 'Courier New', monospace; }
      pre { background-color: #f4f4f4; padding: 1em; border-radius: 5px; overflow-x: auto; font-family: 'Courier New', monospace; white-space: pre-wrap; }
      pre code { background-color: transparent; padding: 0; }
      table { border-collapse: collapse; width: 100%; margin: 1em 0; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <div class="metadata">
      <p><strong>Exported from:</strong> <a href="${url}" target="_blank">${url}</a></p>
      <p><strong>Timestamp:</strong> ${formattedTimestamp}</p>
    </div>
    <div class="chat-export">
      ${content}
    </div>
  </body>
  </html>`;
}
