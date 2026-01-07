function buildPrintHTML({ title, content, url, timestamp }) {
  const formattedTimestamp = new Date(timestamp).toLocaleString();
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        /* Print-specific styles */
        @media print {
            body { 
                font-family: Arial, sans-serif; 
                font-size: 12pt; 
                line-height: 1.4;
                margin: 0.5in;
                color: black;
                background: white;
            }
            .no-print { display: none; }
            .page-break { page-break-before: always; }
            .message { 
                margin-bottom: 1em; 
                padding: 0.5em;
                border-left: 3px solid #ddd;
                page-break-inside: avoid;
            }
            .metadata { 
                margin-bottom: 2em; 
                font-size: 10pt; 
                color: #666; 
                border: 1px solid #ddd;
                padding: 1em;
            }
            h1 { 
                font-size: 16pt; 
                margin-bottom: 0.5em;
                page-break-after: avoid;
            }
            h2, h3 { 
                page-break-after: avoid;
            }
            code { 
                background-color: #f4f4f4; 
                padding: 2px 4px; 
                border-radius: 3px; 
                font-family: 'Courier New', monospace; 
            }
            pre { 
                background-color: #f4f4f4; 
                padding: 1em; 
                border-radius: 5px; 
                overflow-x: auto; 
                font-family: 'Courier New', monospace; 
                white-space: pre-wrap; 
                page-break-inside: avoid;
            }
            pre code { 
                background-color: transparent; 
                padding: 0; 
            }
            table { 
                border-collapse: collapse; 
                width: 100%; 
                margin: 1em 0; 
                page-break-inside: avoid;
            }
            th, td { 
                border: 1px solid #ddd; 
                padding: 8px; 
                text-align: left; 
            }
            th { 
                background-color: #f2f2f2; 
                font-weight: bold;
            }
            a { 
                color: black; 
                text-decoration: underline; 
            }
        }
        
        /* Screen styles (for preview) */
        body { 
            font-family: Arial, sans-serif; 
            margin: 2em; 
            max-width: 800px;
        }
        .message { 
            margin-bottom: 1em; 
            padding: 1em;
            border-left: 3px solid #ddd;
        }
        .metadata { 
            margin-bottom: 2em; 
            font-size: 0.9em; 
            color: #666; 
            border: 1px solid #ddd;
            padding: 1em;
        }
        .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
        }
        .print-button:hover {
            background: #0056b3;
        }
    </style>
</head>
<body>
    <button class="print-button no-print" onclick="window.print()">🖨️ Print</button>
    
    <h1>${title}</h1>
    <div class="metadata">
        <p><strong>Source:</strong> <a href="${url}" target="_blank">${url}</a></p>
        <p><strong>Printed:</strong> ${formattedTimestamp}</p>
    </div>
    
    <div class="chat-content">
        ${content}
    </div>
    
    <script>
        // Auto-print after a short delay to ensure content is loaded
        setTimeout(() => {
            window.print();
        }, 500);
        
        // Close window after printing (optional)
        window.onafterprint = () => {
            setTimeout(() => {
                window.close();
            }, 100);
        };
    </script>
</body>
</html>`;
}

function extractMessagesForPrint() {
  // Try multiple selectors for ChatGPT message containers (in order of preference)
  const selectors = [
    'article[data-testid*="conversation-turn"]',  // Current ChatGPT structure
    'div[data-message-id]',                      // Legacy selector
    'div[data-testid*="message"]',               // Alternative message selector
    'div.group',                                 // Fallback class-based selector
    '[data-message-author-role]'                  // Another common pattern
  ];

  let messages = [];
  for (const selector of selectors) {
    messages = [...document.querySelectorAll(selector)];
    if (messages.length > 0) {
      console.log(`Found ${messages.length} messages using selector: ${selector}`);
      break;
    }
  }

  if (messages.length === 0) {
    console.warn('No chat messages found. Make sure you are on a ChatGPT conversation page with messages.');
    console.log('Available selectors tried:', selectors);
    return '';
  }

  return messages.map(el => {
    // Clean up the message content for printing
    const cloned = el.cloneNode(true);

    // Remove any interactive elements that shouldn't be printed
    const buttons = cloned.querySelectorAll('button');
    buttons.forEach(btn => btn.remove());

    // Remove any copy buttons or other UI elements
    const copyButtons = cloned.querySelectorAll('[data-testid*="copy"], .copy-button');
    copyButtons.forEach(btn => btn.remove());

    // Clean up the message styling
    cloned.style.cssText = 'margin-bottom: 1em; padding: 1em; border-left: 3px solid #ddd;';

    return `<div class="message">${cloned.innerHTML}</div>`;
  }).join('');
}

function buildPrintContent() {
  const title = document.title || "ChatGPT Conversation";
  const url = window.location.href;
  const timestamp = new Date().toISOString();
  const content = extractMessagesForPrint();
  
  return {
    title: title,
    content: content,
    url: url,
    timestamp: timestamp
  };
}
