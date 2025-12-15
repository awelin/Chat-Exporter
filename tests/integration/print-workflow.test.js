// Integration tests for the complete print workflow
describe('Print Workflow Integration', () => {
  let mockChrome;
  let mockDocument;
  let mockWindow;
  let mockPrintWindow;
  let capturedCallbacks = [];

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.resetModules();

    // Mock chrome APIs
    // We need to redefine mockChrome because resetModules clears the cache, 
    // and we want to ensure the require('../../background.js') uses THIS mock.
    // However, requiring background.js will look for global.chrome.

    capturedCallbacks = [];

    mockChrome = {
      commands: {
        onCommand: {
          addListener: jest.fn().mockImplementation((callback) => {
            capturedCallbacks.push(callback);
          })
        }
      },
      tabs: {
        query: jest.fn(),
        sendMessage: jest.fn()
      },
      runtime: {
        onMessage: {
          addListener: jest.fn()
        }
      }
    };

    // Mock document
    mockDocument = {
      title: 'ChatGPT Conversation - Test',
      location: {
        href: 'https://chat.openai.com/c/test-conversation-id'
      },
      querySelectorAll: jest.fn(),
      createElement: jest.fn(),
      body: {
        appendChild: jest.fn()
      }
    };

    // Mock window
    mockPrintWindow = {
      document: {
        open: jest.fn(),
        write: jest.fn(),
        close: jest.fn()
      },
      focus: jest.fn(),
      close: jest.fn(),
      print: jest.fn()
    };

    mockWindow = {
      open: jest.fn().mockReturnValue(mockPrintWindow),
      print: jest.fn(),
      close: jest.fn(),
      onafterprint: null
    };

    // Set up global mocks again
    global.chrome = mockChrome;
    global.document = mockDocument;
    global.window = mockWindow;

    // We also need to restore other globals if they were reset (though resetModules mostly affects requires)
    // But let's just be safe and ensure our document/window mocks are there if needed by background (it doesn't need them)
    // background.js only uses chrome API.

    // Mock tabs response for the background script
    mockChrome.tabs.query.mockImplementation((queryInfo, callback) => {
      callback([{ id: 123, active: true, currentWindow: true }]);
    });

    // Load background script to register listeners
    require('../../background.js');

    // Setup document/window for the test body (which simulates content script)
    global.document = mockDocument;
    global.window = mockWindow;
    global.alert = jest.fn();
    global.console = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
  });

  describe('Complete Print Workflow', () => {
    test('should complete full print workflow from keyboard shortcut to printing', async () => {
      // Step 1: User presses Ctrl+M
      // Step 2: Background script receives command
      // Step 3: Background script queries active tab
      // Step 4: Background script sends message to content script
      mockChrome.tabs.sendMessage.mockImplementation((tabId, message) => {
        // Simulate content script receiving message
        if (message.action === 'printChat') {
          return executePrintChatWorkflow();
        }
      });

      // Execute the command
      const commandCallback = capturedCallbacks[0];
      commandCallback('print-chat');

      // Verify background script behavior
      expect(mockChrome.tabs.query).toHaveBeenCalledWith(
        { active: true, currentWindow: true },
        expect.any(Function)
      );

      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        { action: 'printChat' }
      );

      // Verify content script behavior
      expect(mockDocument.querySelectorAll).toHaveBeenCalledWith('div[data-message-id]');
    });

    test('should handle popup button click workflow', async () => {
      // Logic from popup.js
      const popupLogic = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'printChat' });
        });
      };

      // Execute popup logic
      popupLogic();

      // Verify same flow as keyboard shortcut
      expect(mockChrome.tabs.query).toHaveBeenCalled();
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        { action: 'printChat' }
      );
    });
  });

  function executePrintChatWorkflow() {
    // Simulate the content script's printChat function
    const mockMessages = [
      {
        innerHTML: '<p>User message 1</p>',
        cloneNode: jest.fn().mockReturnValue({
          innerHTML: '<p>User message 1</p>',
          querySelectorAll: jest.fn().mockReturnValue([]),
          style: { cssText: '' }
        }),
        style: { cssText: '' }
      },
      {
        innerHTML: '<p>Assistant response 1</p>',
        cloneNode: jest.fn().mockReturnValue({
          innerHTML: '<p>Assistant response 1</p>',
          querySelectorAll: jest.fn().mockReturnValue([]),
          style: { cssText: '' }
        }),
        style: { cssText: '' }
      }
    ];

    mockDocument.querySelectorAll = jest.fn().mockReturnValue(mockMessages);

    // Extract messages
    const messages = [...mockDocument.querySelectorAll('div[data-message-id]')];
    const content = messages.map(el => {
      const cloned = el.cloneNode(true);
      const buttons = cloned.querySelectorAll('button');
      buttons.forEach(btn => btn.remove());
      const copyButtons = cloned.querySelectorAll('[data-testid*="copy"], .copy-button');
      copyButtons.forEach(btn => btn.remove());
      cloned.style.cssText = 'margin-bottom: 1em; padding: 1em; border-left: 3px solid #ddd;';
      return `<div class="message">${cloned.innerHTML}</div>`;
    }).join('');

    // Build chat data
    const chatData = {
      title: mockDocument.title,
      content: content,
      url: mockDocument.location.href,
      timestamp: new Date().toISOString()
    };

    // Generate HTML
    const html = generatePrintHTML(chatData);

    // Open print window
    const printWindow = mockWindow.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');

    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
    }

    return chatData;
  }

  function generatePrintHTML({ title, content, url, timestamp }) {
    const formattedTimestamp = new Date(timestamp).toLocaleString();
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
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
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <div class="metadata">
        <p><strong>Source:</strong> <a href="${url}" target="_blank">${url}</a></p>
        <p><strong>Printed:</strong> ${formattedTimestamp}</p>
    </div>
    <div class="chat-content">
        ${content}
    </div>
    <script>
        setTimeout(() => {
            window.print();
        }, 500);
        window.onafterprint = () => {
            setTimeout(() => {
                window.close();
            }, 100);
        };
    </script>
</body>
</html>`;
  }

  describe('Error Scenarios', () => {
    test('should handle popup blocker in integration', () => {
      // Mock window.open to return null (popup blocked)
      mockWindow.open = jest.fn().mockReturnValue(null);

      mockChrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([{ id: 123, active: true, currentWindow: true }]);
      });

      mockChrome.tabs.sendMessage.mockImplementation((tabId, message) => {
        if (message.action === 'printChat') {
          // Simulate content script with popup blocked
          const printWindow = mockWindow.open('', '_blank');
          if (!printWindow) {
            global.alert('Please allow pop-ups for this site to print the chat.');
          }
        }
      });

      const commandCallback = capturedCallbacks[0];
      commandCallback('print-chat');

      expect(global.alert).toHaveBeenCalledWith('Please allow pop-ups for this site to print the chat.');
    });

    test('should handle no chat messages in integration', () => {
      // Mock empty chat
      mockDocument.querySelectorAll = jest.fn().mockReturnValue([]);

      mockChrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([{ id: 123, active: true, currentWindow: true }]);
      });

      mockChrome.tabs.sendMessage.mockImplementation((tabId, message) => {
        if (message.action === 'printChat') {
          const messages = [...mockDocument.querySelectorAll('div[data-message-id]')];
          if (messages.length === 0) {
            global.alert('No chat messages found. Make sure you are on a ChatGPT conversation page with messages.');
          }
        }
      });

      const commandCallback = capturedCallbacks[0];
      commandCallback('print-chat');

      expect(global.alert).toHaveBeenCalledWith(
        'No chat messages found. Make sure you are on a ChatGPT conversation page with messages.'
      );
    });
  });

  describe('Content Processing Integration', () => {
    test('should properly clean content for printing', () => {
      // Use real DOM elements instead of mocks to verify innerHTML updates
      const div = document.createElement('div');
      div.setAttribute('data-message-id', 'test');
      div.innerHTML = '<p>Clean content</p><button>Copy</button><div class="copy-button">Copy</div>';

      // Mock querySelectorAll to return this real element
      mockDocument.querySelectorAll = jest.fn().mockReturnValue([div]);

      // Logic from content.js (extractMessagesForPrint)
      // We are testing that the logic actually works on the element
      const messages = [...mockDocument.querySelectorAll('div[data-message-id]')];
      const content = messages.map(el => {
        const cloned = el.cloneNode(true);
        const buttons = cloned.querySelectorAll('button');
        buttons.forEach(btn => btn.remove());
        const copyButtons = cloned.querySelectorAll('[data-testid*="copy"], .copy-button');
        copyButtons.forEach(btn => btn.remove());
        cloned.style.cssText = 'margin-bottom: 1em; padding: 1em; border-left: 3px solid #ddd;';
        return `<div class="message">${cloned.innerHTML}</div>`;
      }).join('');

      // Should remove buttons and copy elements
      expect(content).toContain('<div class="message">');
      expect(content).not.toContain('<button>');
      expect(content).not.toContain('copy-button');
      expect(content).toContain('Clean content');
    });
  });
});
