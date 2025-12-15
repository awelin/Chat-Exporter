# Chat Printer Extension Test Suite

This directory contains comprehensive tests for the Chat Printer Chrome Extension, covering unit tests, integration tests, and end-to-end tests.

## Test Structure

```
tests/
├── unit/           # Unit tests for individual functions
├── integration/    # Integration tests for component interaction
├── e2e/           # End-to-end tests for complete workflows
├── setup.js       # Jest test environment setup
├── package.json   # Test dependencies and scripts
└── README.md      # This file
```

## Test Categories

### Unit Tests (`tests/unit/`)
- **content.test.js**: Tests for content script functions (printChat, extractMessagesForPrint, buildPrintContent, buildPrintHTML)
- **background.test.js**: Tests for background script functionality (command handling, tab management)

### Integration Tests (`tests/integration/`)
- **print-workflow.test.js**: Tests the complete print workflow from keyboard shortcut to printing
- Tests error scenarios like popup blockers and empty conversations
- Validates content processing and HTML generation

### End-to-End Tests (`tests/e2e/`)
- **extension.test.js**: Tests the complete extension functionality using Playwright
- Simulates real browser interactions with ChatGPT
- Tests extension installation, popup functionality, and keyboard shortcuts

## Running Tests

### Prerequisites
```bash
cd tests
npm install
```

### Test Commands
```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only

# Development modes
npm run test:watch        # Watch mode for development
npm run test:coverage     # Run with coverage report

# CI/CD mode
npm run test:ci           # Non-watch mode with coverage
```

## Test Coverage

The test suite provides comprehensive coverage for:

- **Content Script Functions**
  - Message extraction and cleaning
  - Print HTML generation
  - Error handling (popup blockers, empty conversations)
  - Content sanitization (removing buttons, copy elements)

- **Background Script Functions**
  - Keyboard shortcut handling (Ctrl+M)
  - Tab query and message sending
  - Command routing

- **Integration Workflows**
  - Complete print workflow from user action to printing
  - Error scenarios and edge cases
  - Content processing and formatting

- **Extension Functionality**
  - Popup button interactions
  - Keyboard shortcuts
  - Chrome extension APIs

## Mock Environment

The test setup includes comprehensive mocks for:
- Chrome extension APIs (chrome.runtime, chrome.tabs, chrome.commands)
- DOM APIs (document.querySelector, window.open, etc.)
- Print functionality (window.print, onafterprint)
- User interactions (alert, confirm)

## Custom Matchers

The test suite includes custom Jest matchers:
- `toHaveValidPrintHTML`: Validates print HTML structure
- Chrome API interaction testing

## Test Data

Tests use realistic mock data:
- ChatGPT conversation messages
- Various content types (text, code blocks, lists)
- Error scenarios (popup blockers, empty content)

## Continuous Integration

Tests are configured for CI/CD with:
- Non-watch mode execution
- Coverage reporting
- Timeout handling
- Error reporting

## Adding New Tests

When adding new functionality:

1. **Unit Tests**: Add to `tests/unit/` for new functions
2. **Integration Tests**: Add to `tests/integration/` for component interaction
3. **E2E Tests**: Add to `tests/e2e/` for complete workflows

Follow the existing patterns:
- Use descriptive test names
- Include error scenario tests
- Mock external dependencies
- Test both success and failure cases
