// Test setup file for Jest
const fs = require('fs');
const path = require('path');

// Mock Chrome extension APIs
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn()
      }
    },
    sendMessage: jest.fn()
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  commands: {
    onCommand: {
      addListener: jest.fn()
    }
  },
  downloads: {
    download: jest.fn()
  }
};

// Mock DOM APIs
global.document = {
  title: 'Test ChatGPT Conversation',
  location: {
    href: 'https://chat.openai.com/c/test-conversation-id'
  },
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(),
  createElement: jest.fn(),
  body: {
    appendChild: jest.fn()
  },
  head: {
    appendChild: jest.fn()
  }
};

// Mock Window APIs
global.window = {
  open: jest.fn(),
  close: jest.fn(),
  print: jest.fn(),
  onafterprint: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

// Mock console for testing
global.console = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn()
};

// Mock alert, confirm, prompt
global.alert = jest.fn();
global.confirm = jest.fn();
global.prompt = jest.fn();

// Mock fetch for any network requests
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL = {
  createObjectURL: jest.fn().mockReturnValue('blob:mock-url'),
  revokeObjectURL: jest.fn()
};

// Mock Blob
global.Blob = class {
  constructor(parts, options) {
    this.parts = parts;
    this.type = options?.type || '';
    this.size = parts.reduce((acc, part) => acc + (part.length || 0), 0);
  }
};

// Mock performance.now
global.performance = {
  now: jest.fn().mockReturnValue(Date.now())
};

// Mock Date for consistent testing
const mockDate = new Date('2023-12-15T12:00:00.000Z');
global.Date = jest.fn(() => mockDate);
global.Date.now = jest.fn(() => mockDate.getTime());

// Setup test environment cleanup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset common mocks
  document.querySelectorAll = jest.fn().mockReturnValue([]);
  document.querySelector = jest.fn();
  window.open = jest.fn().mockReturnValue({
    document: {
      open: jest.fn(),
      write: jest.fn(),
      close: jest.fn()
    },
    focus: jest.fn(),
    close: jest.fn(),
    print: jest.fn()
  });
});

afterEach(() => {
  // Cleanup after each test if needed
});

// Global test utilities
global.testHelpers = {
  // Create mock message element for ChatGPT
  createMockMessage: (id, content, hasButtons = false) => ({
    getAttribute: jest.fn().mockReturnValue(id),
    cloneNode: jest.fn().mockReturnValue({
      innerHTML: content,
      querySelectorAll: jest.fn().mockReturnValue(hasButtons ? [
        { remove: jest.fn() },
        { remove: jest.fn() }
      ] : []),
      style: { cssText: '' }
    }),
    innerHTML: content,
    style: { cssText: '' }
  }),

  // Mock print window
  createMockPrintWindow: () => ({
    document: {
      open: jest.fn(),
      write: jest.fn(),
      close: jest.fn()
    },
    focus: jest.fn(),
    close: jest.fn(),
    print: jest.fn()
  }),

  // Mock Chrome tab
  createMockTab: (id, url, active = true) => ({
    id,
    url,
    active,
    currentWindow: true
  })
};

// Ignore console warnings during tests unless explicitly testing them
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;

beforeAll(() => {
  // Suppress console warnings/errors during normal test runs
  console.warn = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  // Restore console methods after all tests
  console.warn = originalConsoleWarn;
  console.error = originalConsoleError;
});

// Custom Jest matchers for extension testing
expect.extend({
  toHaveBeenCalledWithChromeCommand(received, expectedCommand) {
    const pass = this.utils.printReceived
    const call = chrome.commands.onCommand.addListener.mock.calls.find(
      call => call[0].toString().includes(expectedCommand)
    );
    
    if (call) {
      return {
        message: () => `expected command "${expectedCommand}" not to have been called`,
        pass: true
      };
    } else {
      return {
        message: () => `expected command "${expectedCommand}" to have been called`,
        pass: false
      };
    }
  },

  toHaveValidPrintHTML(received) {
    const hasDoctype = received.includes('<!DOCTYPE html>');
    const hasTitle = received.includes('<title>');
    const hasPrintStyles = received.includes('@media print');
    const hasPrintFunction = received.includes('window.print()');
    
    const pass = hasDoctype && hasTitle && hasPrintStyles && hasPrintFunction;
    
    if (pass) {
      return {
        message: () => 'HTML should not be valid print HTML',
        pass: false
      };
    } else {
      return {
        message: () => 'HTML should be valid print HTML with DOCTYPE, title, print styles, and print function',
        pass: true
      };
    }
  }
});

// Export test helpers for use in tests
module.exports = {
  chrome: global.chrome,
  document: global.document,
  window: global.window,
  console: global.console
};
