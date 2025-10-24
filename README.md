# Chat Exporter

A Chrome extension that allows you to export ChatGPT conversations as HTML or Markdown files for easy saving and sharing.

## Features

- **Export to HTML**: Preserves the original ChatGPT styling and formatting, making it human-readable and suitable for manual review or sharing. Recommended to convert HTML exports to PDF for better portability and archiving.
- **Export to Markdown**: Provides a structured text format that is (maybe) more suitable for AI consumption and processing, though it may have some formatting issues that make it less readable for humans.
- **Keyboard Shortcuts**:
  - `Ctrl+M`: Export as Markdown
  - `Ctrl+Shift+H`: Export as HTML
- **Popup Interface**: Simple one-click export button for HTML format.
- **Local Downloads**: Files are automatically downloaded to your default download folder.

## Installation

1. Download or clone this repository to your local machine.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" in the top right corner.
4. Click "Load unpacked" and select the project directory (`Chat Exporter Chrome Extension`).
5. The extension will be installed and ready to use.

## Usage

1. Open ChatGPT in your browser (https://chatgpt.com/*).
2. Conduct your conversation as usual.
3. **Using the Popup**: Click the Chat Exporter extension icon and click "Export Chat" to export as HTML.
4. **Using Keyboard Shortcuts**:
   - Press `Ctrl+M` to export the current conversation as Markdown.
   - Press `Ctrl+Shift+H` to export the current conversation as HTML.
5. The exported file will automatically download to your Downloads folder, named with the conversation title and appropriate extension (.html or .md).

## How It Works

The extension injects content scripts into ChatGPT pages that extract conversation messages using the page's DOM structure. It then builds formatted HTML or Markdown files with metadata including:
- Original page URL
- Export timestamp
- Conversation title
- Styled message content

## License

This project is open source and available under the MIT License.
