console.log('Chat Printer Content Script Loaded on:', window.location.href);



// Visual feedback for debugging and user confirmation
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: ${type === 'error' ? '#dc3545' : '#28a745'};
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 10001;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        font-family: sans-serif;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    document.body.appendChild(toast);

    // Fade in
    requestAnimationFrame(() => toast.style.opacity = '1');

    // Fade out and remove
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function downloadHTML() {
    try {
        const chatData = buildPrintContent();
        if (!chatData.content) {
            showToast('No chat content found', 'error');
            return;
        }

        const htmlContent = buildPrintHTML(chatData, { autoPrint: false, showPrintButton: false });
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatgpt-export-${new Date().toISOString().slice(0, 10)}.html`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('HTML Exported Successfully');
    } catch (e) {
        console.error('HTML Export Error:', e);
        showToast('Failed to export HTML', 'error');
    }
}

function downloadMarkdown() {
    try {
        const chatData = buildPrintContent();
        if (!chatData.content) {
            showToast('No chat content found', 'error');
            return;
        }
        const mdContent = convertToMarkdown(chatData);
        const blob = new Blob([mdContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chatgpt-export-${new Date().toISOString().slice(0, 10)}.md`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Markdown Exported Successfully');
    } catch (e) {
        console.error('MD Export Error:', e);
        showToast('Failed to export Markdown', 'error');
    }
}

function convertToMarkdown(chatData) {
    let md = `# ${chatData.title}\n\n`;
    md += `**Source:** ${chatData.url}\n`;
    md += `**Date:** ${new Date(chatData.timestamp).toLocaleString()}\n\n---\n\n`;

    // Create a temp element to parse the HTML content we already prepared
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = chatData.content;

    const messages = tempDiv.querySelectorAll('.message');
    messages.forEach(msg => {
        // Simple HTML to MD conversion
        let text = msg.innerText;
        // Basic cleanup
        md += `${text}\n\n---\n\n`;
    });

    return md;
}

chrome.runtime.onMessage.addListener((msg) => {
    console.log('Content script received message:', msg);

    if (msg.action === "printChat") {
        printChat();
    } else if (msg.action === "exportMarkdown") {
        showToast('Exporting Markdown...');
        downloadMarkdown();
    } else if (msg.action === "exportHTML") {
        showToast('Exporting HTML...');
        downloadHTML();
    }
});

// Fallback: Listen for shortcuts directly in the page
// This bypasses Chrome Command API issues if they occur
document.addEventListener('keydown', (e) => {
    // Ctrl + M
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        console.log('Shortcut detected via content script: Ctrl+M');
        showToast('Exporting Markdown...');
        downloadMarkdown();
    }
    // Ctrl + Shift + H
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault();
        console.log('Shortcut detected via content script: Ctrl+Shift+H');
        showToast('Exporting HTML...');
        downloadHTML();
    }
});

function printChat() {
    try {
        // Get the print-optimized content
        const chatData = buildPrintContent();

        if (!chatData.content || chatData.content.trim() === '') {
            console.warn('No chat content found');
            alert('No chat messages found. Make sure you are on a ChatGPT conversation page with messages.');
            return;
        }

        // Create a new window for printing
        const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');

        if (!printWindow) {
            alert('Please allow pop-ups for this site to print the chat.');
            return;
        }

        // Generate print-ready HTML
        const printHTML = buildPrintHTML(chatData, { autoPrint: true, showPrintButton: true });

        // Write the HTML to the new window
        printWindow.document.open();
        printWindow.document.write(printHTML);
        printWindow.document.close();


    } catch (error) {
        console.error('Error printing chat:', error);
        alert('Error while preparing chat for printing. Please try again. Check console for details.');
    }
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

function buildPrintHTML({ title, content, url, timestamp }, options = { autoPrint: true, showPrintButton: true }) {
    const formattedTimestamp = new Date(timestamp).toLocaleString();

    let scriptContent = '';
    if (options.autoPrint) {
        scriptContent = `
        < script >
        // Auto-print after a short delay to ensure content is loaded
        setTimeout(() => {
            window.print();
        }, 500);

    // Close window after printing
    window.onafterprint = () => {
        setTimeout(() => {
            window.close();
        }, 100);
    };
    </script > `;
    }

    let buttonContent = '';
    if (options.showPrintButton) {
        buttonContent = `< button class="print-button no-print" onclick = "window.print()" >🖨️ Print</button > `;
    }

    return `
        < !DOCTYPE html >
            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>${title}</title>
                            <style>
        /* Print-specific styles */
                                @media print {
                                    body {
                                    font - family: Arial, sans-serif;
                                font-size: 12pt;
                                line-height: 1.4;
                                margin: 0.5in;
                                color: black;
                                background: white;
            }
                                .no-print {display: none; }
                                .page-break {page -break-before: always; }
                                .message {
                                    margin - bottom: 1em;
                                padding: 0.5em;
                                border-left: 3px solid #ddd;
                                page-break-inside: avoid;
            }
                                .metadata {
                                    margin - bottom: 2em;
                                font-size: 10pt;
                                color: #666;
                                border: 1px solid #ddd;
                                padding: 1em;
            }
                                h1 {
                                    font - size: 16pt;
                                margin-bottom: 0.5em;
                                page-break-after: avoid;
            }
                                h2, h3 {
                                    page -break-after: avoid;
            }
                                code {
                                    background - color: #f4f4f4;
                                padding: 2px 4px;
                                border-radius: 3px;
                                font-family: 'Courier New', monospace; 
            }
                                pre {
                                    background - color: #f4f4f4;
                                padding: 1em;
                                border-radius: 5px;
                                overflow-x: auto;
                                font-family: 'Courier New', monospace;
                                white-space: pre-wrap;
                                page-break-inside: avoid;
            }
                                pre code {
                                    background - color: transparent;
                                padding: 0; 
            }
                                table {
                                    border - collapse: collapse;
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
                                    background - color: #f2f2f2;
                                font-weight: bold;
            }
                                a {
                                    color: black;
                                text-decoration: underline; 
            }
        }

                                /* Screen styles (for preview) */
                                body {
                                    font - family: Arial, sans-serif;
                                margin: 2em;
                                max-width: 800px;
        }
                                .message {
                                    margin - bottom: 1em;
                                padding: 1em;
                                border-left: 3px solid #ddd;
        }
                                .metadata {
                                    margin - bottom: 2em;
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
                            ${buttonContent}

                            <h1>${title}</h1>
                            <div class="metadata">
                                <p><strong>Source:</strong> <a href="${url}" target="_blank">${url}</a></p>
                                <p><strong>Printed:</strong> ${formattedTimestamp}</p>
                            </div>

                            <div class="chat-content">
                                ${content}
                            </div>

                            ${scriptContent}
                        </body>
                    </html>`;
}
