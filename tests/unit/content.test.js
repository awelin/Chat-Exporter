// Unit tests for content.js functions
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Load the content script
const contentScript = fs.readFileSync(path.join(__dirname, '../../content.js'), 'utf8');

// Test Suite for Content Script Functions
describe('Content Script Functions', () => {
  let sandbox;
  let mockMessages;

  beforeEach(() => {
    // 1. Create mocks
    const mockRuntime = {
      onMessage: {
        addListener: jest.fn()
      },
      sendMessage: jest.fn()
    };

    const mockChrome = {
      runtime: mockRuntime
    };

    const mockDocument = {
      title: 'Test ChatGPT Conversation',
      location: {
        href: 'https://chat.openai.com/c/test-conversation-id'
      },
      querySelectorAll: jest.fn(),
      createElement: jest.fn(),
      addEventListener: jest.fn(),
      body: {
        appendChild: jest.fn()
      }
    };

    const mockWindow = {
      open: jest.fn(),
      print: jest.fn(),
      close: jest.fn(),
      location: mockDocument.location,
      document: mockDocument
    };

    const mockConsole = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    const mockAlert = jest.fn();

    // 2. Prepare Sandbox Context
    sandbox = {
      chrome: mockChrome,
      document: mockDocument,
      window: mockWindow,
      console: mockConsole,
      alert: mockAlert,
      Date: Date, // Pass through Date constructor
      setTimeout: setTimeout // Pass through setTimeout
    };

    vm.createContext(sandbox);

    // 3. Run the script
    vm.runInContext(contentScript, sandbox);

    // 4. Setup Mock Data (for querySelectorAll)
    mockMessages = [
      {
        innerHTML: '<p>Hello, how can I help you?</p>',
        cloneNode: jest.fn(),
        style: { cssText: '' }
      },
      {
        innerHTML: '<p>What is 2+2?</p>',
        cloneNode: jest.fn(),
        style: { cssText: '' }
      },
      {
        innerHTML: '<p>2+2 equals 4.</p>',
        cloneNode: jest.fn(),
        style: { cssText: '' }
      }
    ];

    mockDocument.querySelectorAll.mockReturnValue(mockMessages);

    // We need to setup cloneNode behavior on the messages 
    // BUT the script uses document.querySelectorAll to get them.
    // The script then calls cloneNode on the elements returned.
    // So we need to ensure the elements returned by mockDocument.querySelectorAll have working cloneNode.

    mockMessages.forEach(message => {
      message.cloneNode.mockReturnValue({
        ...message,
        innerHTML: message.innerHTML,
        querySelectorAll: jest.fn().mockReturnValue([]),
        style: { cssText: '' },
        remove: jest.fn()
      });
    });
  });

  describe('extractMessagesForPrint', () => {
    test('should extract messages when chat messages are present', () => {
      // Mock the first selector to return messages (simulating current ChatGPT structure)
      sandbox.document.querySelectorAll.mockImplementation((selector) => {
        if (selector === 'article[data-testid*="conversation-turn"]') {
          return mockMessages;
        }
        return [];
      });

      // Execute function in sandbox
      const result = vm.runInContext('extractMessagesForPrint()', sandbox);

      expect(result).toContain('<div class="message">');
      expect(result).toContain('<p>Hello, how can I help you?</p>');
      expect(sandbox.document.querySelectorAll).toHaveBeenCalledWith('article[data-testid*="conversation-turn"]');
    });

    test('should handle empty chat gracefully', () => {
      sandbox.document.querySelectorAll.mockReturnValue([]);

      const result = vm.runInContext('extractMessagesForPrint()', sandbox);

      expect(result).toBe('');
      expect(sandbox.console.warn).toHaveBeenCalled();
    });
  });

  describe('buildPrintContent', () => {
    test('should build correct chat data structure', () => {
      const chatData = vm.runInContext('buildPrintContent()', sandbox);

      expect(chatData.title).toBe('Test ChatGPT Conversation');
      expect(chatData.url).toBe('https://chat.openai.com/c/test-conversation-id');
      expect(chatData.content).toContain('<div class="message">');
      expect(chatData.timestamp).toBeTruthy();
    });
  });

  describe('buildPrintHTML', () => {
    test('should generate valid HTML with print styles', () => {
      // Prepare data in sandbox
      sandbox.testChatData = {
        title: 'Test Conversation',
        content: '<div class="message"><p>Test message</p></div>',
        url: 'https://chat.openai.com/test',
        timestamp: '2023-12-15T12:00:00.000Z'
      };

      const html = vm.runInContext('buildPrintHTML(testChatData)', sandbox);

      expect(html).toContain('DOCTYPE html');
      expect(html).toContain('<title>Test Conversation</title>');
      expect(html).toContain('@media print');
      expect(html).toContain('Test message');
      expect(html).toContain('window.print()');
    });

    test('should include print-optimized CSS', () => {
      sandbox.testChatData = {
        title: 'Test',
        content: 'test',
        url: 'test',
        timestamp: 'test'
      };

      const html = vm.runInContext('buildPrintHTML(testChatData)', sandbox);

      expect(html).toContain('font-size: 12pt');
      expect(html).toContain('margin: 0.5in');
      expect(html).toContain('page-break-inside: avoid');
    });
  });

  describe('chrome.runtime.onMessage', () => {
    test('should listen for printChat messages', () => {
      // The script runs in beforeEach, so listener should be registered
      expect(sandbox.chrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });
  });
});
