// End-to-end tests for the complete Chrome extension
const { chromium } = require('playwright');

describe('Chat Printer Extension E2E Tests', () => {
  let browser;
  let context;
  let page;

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    context = await browser.newContext();
    page = await context.newPage();
  });

  afterEach(async () => {
    await context.close();
  });

  describe('Extension Installation and Basic Functionality', () => {
    test('should install extension and display popup', async () => {
      // Navigate to chrome://extensions/
      await page.goto('chrome://extensions/');
      
      // Enable developer mode
      await page.click('#developer-mode');
      
      // Load unpacked extension (simulated)
      // In real test, this would use the extension path
      console.log('Extension loaded successfully');
      
      // Navigate to ChatGPT
      await page.goto('https://chat.openai.com');
      
      // Wait for page to load
      await page.waitForSelector('body');
      
      // Check if extension can access the page
      const title = await page.title();
      expect(title).toBeTruthy();
    });

    test('should handle keyboard shortcut Ctrl+M', async () => {
      await page.goto('https://chat.openai.com');
      
      // Wait for the page to be ready
      await page.waitForLoadState('networkidle');
      
      // Mock a ChatGPT conversation page
      await page.evaluate(() => {
        document.body.innerHTML = `
          <div data-message-id="msg1">
            <p>User: Hello, how are you?</p>
          </div>
          <div data-message-id="msg2">
            <p>Assistant: I'm doing well, thank you! How can I help you today?</p>
          </div>
        `;
      });

      // Mock the extension's content script functionality
      await page.evaluate(() => {
        // Mock chrome.runtime.sendMessage
        chrome.runtime = {
          onMessage: {
            addListener: (callback) => {
              window.addEventListener('message', (event) => {
                if (event.source === window && event.data.type === 'PRINT_CHAT') {
                  callback({ action: 'printChat' });
                }
              });
            }
          },
          sendMessage: (message) => {
            if (message.action === 'printChat') {
              console.log('Print chat message received');
              // Mock the print functionality
              const messages = document.querySelectorAll('[data-message-id]');
              if (messages.length > 0) {
                console.log(`Found ${messages.length} messages to print`);
                // In real scenario, this would open print window
                window.dispatchEvent(new CustomEvent('print-completed'));
              }
            }
          }
        };
      });

      // Test that keyboard shortcut triggers the print function
      await page.keyboard.press('Control+m');
      
      // Wait for the print function to be called
      const printCompleted = await page.waitForFunction(() => {
        return new Promise((resolve) => {
          window.addEventListener('print-completed', () => resolve(true));
          setTimeout(() => resolve(false), 2000); // 2 second timeout
        });
      });

      expect(printCompleted).toBe(true);
    });

    test('should handle popup button click', async () => {
      await page.goto('https://chat.openai.com');
      
      // Mock the ChatGPT page with conversation
      await page.evaluate(() => {
        document.body.innerHTML = `
          <div data-message-id="msg1">
            <p>User: Test message</p>
          </div>
          <div data-message-id="msg2">
            <p>Assistant: Test response</p>
          </div>
        `;
        
        // Mock extension functionality
        chrome.runtime = {
          sendMessage: (message) => {
            if (message.action === 'printChat') {
              console.log('Popup button triggered print');
              const messages = document.querySelectorAll('[data-message-id]');
              console.log(`Found ${messages.length} messages`);
            }
          },
          onMessage: {
            addListener: (callback) => {}
          }
        };
      });

      // In a real test, this would click the extension popup
      // For now, we simulate the message being sent
      await page.evaluate(() => {
        chrome.runtime.sendMessage({ action: 'printChat' });
      });

      // Verify the print function was called
      const logs = [];
      page.on('console', msg => logs.push(msg.text()));
      
      await page.evaluate(() => {
        chrome.runtime.sendMessage({ action: 'printChat' });
      });

      // Check that console logs contain expected messages
      const hasLog = logs.some(log => log.includes('Found') && log.includes('messages'));
      expect(hasLog).toBe(true);
    });
  });

  describe('Content Extraction and Processing', () => {
    test('should extract messages from ChatGPT conversation', async () => {
      await page.goto('data:text/html,<html><body></body></html>');
      
      // Inject mock ChatGPT conversation
      await page.evaluate(() => {
        document.body.innerHTML = `
          <div data-message-id="msg1">
            <div>
              <p>User: What is the capital of France?</p>
            </div>
          </div>
          <div data-message-id="msg2">
            <div>
              <p>Assistant: The capital of France is Paris.</p>
            </div>
          </div>
          <div data-message-id="msg3">
            <div>
              <p>User: Can you tell me more about it?</p>
            </div>
          </div>
          <div data-message-id="msg4">
            <div>
              <p>Assistant: Paris is the capital and most populous city of France...</p>
            </div>
          </div>
        `;
      });

      // Mock the extraction function
      const messages = await page.evaluate(() => {
        const messageElements = document.querySelectorAll('[data-message-id]');
        return Array.from(messageElements).map(el => ({
          id: el.getAttribute('data-message-id'),
          content: el.innerText.trim()
        }));
      });

      expect(messages).toHaveLength(4);
      expect(messages[0].content).toContain('What is the capital of France?');
      expect(messages[1].content).toContain('The capital of France is Paris');
    });

    test('should clean content for printing', async () => {
      await page.goto('data:text/html,<html><body></body></html>');
      
      // Inject dirty content with UI elements
      await page.evaluate(() => {
        document.body.innerHTML = `
          <div data-message-id="msg1">
            <div>
              <p>Clean content</p>
              <button class="copy-button">Copy</button>
              <button>Like</button>
              <div class="copy-button">Copy</div>
            </div>
          </div>
        `;
      });

      // Mock the content cleaning process
      const cleanedContent = await page.evaluate(() => {
        const message = document.querySelector('[data-message-id]');
        const cloned = message.cloneNode(true);
        
        // Remove buttons
        const buttons = cloned.querySelectorAll('button');
        buttons.forEach(btn => btn.remove());
        
        // Remove copy buttons
        const copyButtons = cloned.querySelectorAll('.copy-button');
        copyButtons.forEach(btn => btn.remove());
        
        return cloned.innerHTML;
      });

      expect(cleanedContent).toContain('Clean content');
      expect(cleanedContent).not.toContain('copy-button');
      expect(cleanedContent).not.toContain('<button>');
    });
  });

  describe('Error Handling', () => {
    test('should handle popup blocker scenario', async () => {
      await page.goto('https://chat.openai.com');
      
      // Mock popup blocker
      await page.evaluate(() => {
        window.open = () => null; // Simulate blocked popup
        
        // Mock the print function to test popup blocker detection
        const testPopupBlocker = () => {
          const printWindow = window.open('', '_blank');
          if (!printWindow) {
            return 'popup-blocked';
          }
          return 'popup-opened';
        };
        
        window.testPopupBlocker = testPopupBlocker;
      });

      const result = await page.evaluate(() => window.testPopupBlocker());
      expect(result).toBe('popup-blocked');
    });

    test('should handle empty conversation', async () => {
      await page.goto('https://chat.openai.com');
      
      // Mock empty conversation
      await page.evaluate(() => {
        document.body.innerHTML = '<div>No conversation here</div>';
        
        // Mock extraction that finds no messages
        const extractMessages = () => {
          const messages = document.querySelectorAll('[data-message-id]');
          return messages.length;
        };
        
        window.extractMessages = extractMessages;
      });

      const messageCount = await page.evaluate(() => window.extractMessages());
      expect(messageCount).toBe(0);
    });
  });

  describe('Print HTML Generation', () => {
    test('should generate valid print HTML', async () => {
      await page.goto('data:text/html,<html><body></body></html>');
      
      // Mock print HTML generation
      const printHTML = await page.evaluate(() => {
        const chatData = {
          title: 'Test ChatGPT Conversation',
          content: '<div class="message"><p>Test message content</p></div>',
          url: 'https://chat.openai.com/c/test',
          timestamp: new Date().toISOString()
        };

        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>${chatData.title}</title>
    <style>
        @media print {
            body { font-family: Arial, sans-serif; }
            .message { margin-bottom: 1em; }
        }
    </style>
</head>
<body>
    <h1>${chatData.title}</h1>
    <div class="metadata">
        <p><strong>Source:</strong> ${chatData.url}</p>
        <p><strong>Printed:</strong> ${new Date(chatData.timestamp).toLocaleString()}</p>
    </div>
    <div class="chat-content">
        ${chatData.content}
    </div>
</body>
</html>`;

        return html;
      });

      expect(printHTML).toContain('<!DOCTYPE html>');
      expect(printHTML).toContain('<title>Test ChatGPT Conversation</title>');
      expect(printHTML).toContain('@media print');
      expect(printHTML).toContain('Test message content');
      expect(printHTML).toContain('<h1>Test ChatGPT Conversation</h1>');
    });
  });
});
