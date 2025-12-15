// Unit tests for background.js
describe('Background Script Functions', () => {
  let mockChrome;
  let mockTabs;
  let capturedCallbacks = [];

  beforeAll(() => {
    // Clear any existing captured callbacks
    capturedCallbacks = [];

    // Mock chrome APIs
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

    // Mock the global chrome object
    global.chrome = mockChrome;

    // Mock tabs query response
    mockTabs = [
      { id: 123, url: 'https://chat.openai.com/c/test-conversation', active: true, currentWindow: true }
    ];
  });

  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();

    // Reset captured callbacks
    capturedCallbacks = [];

    // Reset modules to allow re-requiring background.js
    jest.resetModules();

    // Mock chrome APIs again because resetModules might affect global mocks if they were required
    // (But here they are on global object, so it should be fine, but ensuring the mock implementation persists is key)
    chrome.commands.onCommand.addListener.mockImplementation((callback) => {
      capturedCallbacks.push(callback);
    });

    // Re-load background script to trigger listener registration
    require('../../background.js');
  });

  describe('chrome.commands.onCommand', () => {
    test('should listen for print-chat command', () => {
      // Verify the listener was set up
      expect(chrome.commands.onCommand.addListener).toHaveBeenCalled();
      expect(capturedCallbacks.length).toBe(1);
    });

    test('should handle print-chat command correctly', () => {
      // Mock tabs.query to return our test tab
      chrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback(mockTabs);
      });

      // Execute the callback as if the command was triggered
      const commandCallback = capturedCallbacks[0];
      commandCallback('print-chat');

      // Verify correct behavior
      expect(chrome.tabs.query).toHaveBeenCalledWith(
        { active: true, currentWindow: true },
        expect.any(Function)
      );

      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        123,
        { action: 'printChat' }
      );
    });

    test('should not trigger for other commands', () => {
      chrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback(mockTabs);
      });

      // Execute callback with a different command
      const commandCallback = capturedCallbacks[0];
      commandCallback('some-other-command');

      // tabs.sendMessage should not be called for non print-chat commands
      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    test('should handle multiple tabs scenario', () => {
      // Mock multiple tabs scenario
      const multipleTabs = [
        { id: 123, url: 'https://chat.openai.com/c/conversation1', active: true, currentWindow: true },
        { id: 124, url: 'https://chat.openai.com/c/conversation2', active: false, currentWindow: true }
      ];

      chrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback(multipleTabs);
      });

      const commandCallback = capturedCallbacks[0];
      commandCallback('print-chat');

      // Should send message to the active tab only
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(
        123, // active tab ID
        { action: 'printChat' }
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle tabs.query errors gracefully', () => {
      // Mock tabs.query to return an error
      chrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback(null, 'Error: No tabs found');
      });

      // This should not throw an error
      expect(() => {
        const commandCallback = capturedCallbacks[0];
        commandCallback('print-chat');
      }).not.toThrow();

      // sendMessage should not be called if tabs query fails
      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });

    test('should handle empty tabs array', () => {
      // Mock empty tabs array
      chrome.tabs.query.mockImplementation((queryInfo, callback) => {
        callback([]);
      });

      const commandCallback = capturedCallbacks[0];
      commandCallback('print-chat');

      // Should not try to send message if no tabs found
      expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
    });
  });
});
